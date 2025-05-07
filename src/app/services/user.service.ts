import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, switchMap, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient, private authService: AuthService) { }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User[]>(`${this.apiUrl}?email=${email}`).pipe(
      map(users => {
        if (!users || users.length === 0) {
          throw new Error('User not found');
        }
        return users[0];
      }),
      catchError(error => throwError(() => error))
    );
  }

  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${user.id}`, user).pipe(
      switchMap(currentDBUser => {
        if (user.password === '' && currentDBUser.password) {
          user = { ...user, password: currentDBUser.password}
        }
        return this.http.put<User>(`${this.apiUrl}/${user.id}`, user);
      }),
      catchError(error => throwError(() => error))
    );
  }

  updateCurrentUser(user: Partial<User>): Observable<User> {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser || !currentUser.id) {
      return throwError(() => new Error('No authenticated user found'));
    }

    // Fetch the current user from the DB to ensure have all properties
    return this.http.get<User>(`${this.apiUrl}/${currentUser.id}`).pipe(
      switchMap(dbUser => {
        // Merge the db user with updated fields
        const updatedUser = {
          ...dbUser,
          ...user,
          password: user.password || dbUser.password,
          updatedAt: Date.now()
        };

        return this.http.put<User>(`${this.apiUrl}/${currentUser.id}`, updatedUser);
      }),
      catchError(error => throwError(() => error))
    );
  }

  updateUserProfile(profileData: Partial<User>): Observable<User> {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser || !currentUser.id) {
      return throwError(() => new Error('No authenticated user found'));
    }

    // Fetch the current user from db first
    return this.http.get<User>(`${this.apiUrl}/${currentUser.id}`).pipe(
      switchMap(dbUser => {
        const updatedUser = {
          ...dbUser,
          name: profileData.name || dbUser.name,
          bio: profileData.bio !== undefined ? profileData.bio : dbUser.bio,
          profileImage: profileData.profileImage || dbUser.profileImage,
          theme: profileData.theme || dbUser.theme,
          updatedAt: Date.now(),
          password: dbUser.password
        };

        return this.http.put<User>(`${this.apiUrl}/${currentUser.id}`, updatedUser);
      }),
      catchError(error => throwError(() => error))
    );
  }

  toggleTwoFactorAuth(enable: boolean): Observable<User> {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser || !currentUser.id) {
      return throwError(() => new Error('No authenticated user found'));
    }

    const updatedUser = {
      ...currentUser,
      twoFactorEnabled: enable,
      updatedAt: Date.now()
    };

    return this.http.put<User>(`${this.apiUrl}/${currentUser.id}`, updatedUser).pipe(
      catchError(error => throwError(() => error))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<User> {
    const currentUser = this.authService.currentUserValue;

    if(!currentUser || !currentUser.id) {
      return throwError(() => new Error('No authenticated user found'));
    }

    return this.getUserById(currentUser.id).pipe(
      catchError(error => throwError(() => error)),
      switchMap(user => {
        if (user.password !== currentPassword) {
          return throwError(() => new Error('Password is incorrect'));
        }

        const updatedUser = {
          ...user,
          password: newPassword,
          updatedAt: Date.now()
        };

        return this.http.put<User>(`${this.apiUrl}/${user.id}`, updatedUser).pipe(
          catchError(error => throwError(() => error))
        );
      })
    );
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  uploadProfileImage(imageFile: File): Observable<string> {
    return new Observable<string>(observer => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        observer.next(e.target.result);
        observer.complete();
      };

      reader.onerror = (error) => {
        observer.error('Error uploading image: ' + error);
      };
      reader.readAsDataURL(imageFile);
    });
  }
}
