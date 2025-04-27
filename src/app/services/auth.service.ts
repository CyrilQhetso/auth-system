import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/users';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  
  constructor(private http: HttpClient, private snackbar: MatSnackBar) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }
  
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
  
  register(user: User): Observable<User> {
    return this.http.get<User[]>(`${this.apiUrl}?email=${user.email}`).pipe(
      switchMap(users => {
        if (users.length > 0) {
          throw new Error('Email already exists');
        }
        const newUser = {
          ...user,
          isVerified: false,
          id: Date.now().toString()
        };
        return this.http.post<User>(this.apiUrl, newUser).pipe(
          tap(createdUser => {
            this.generateOtp(createdUser).subscribe();
          })
        );
      }),
      catchError(error => throwError(() => error))
    );
  }
  
  login(email: string, password: string): Observable<User> {
    return this.http.get<User[]>(`${this.apiUrl}?email=${email}&password=${password}`).pipe(
      map(users => {
        if (users.length === 0) {
          throw new Error('Invalid email or password');
        }
        const user = users[0];
        if (!user.isVerified) {
          this.generateOtp(user).subscribe();
          throw new Error('User not verified. OTP sent.');
        }
        return user;
      }),
      tap(user => {
        const safeUser: User = { ...user, password: '', otp: '', otpExpiry: undefined };
        localStorage.setItem('currentUser', JSON.stringify(safeUser));
        this.currentUserSubject.next(safeUser);
      }),
      catchError(error => throwError(() => error))
    );
  }
  
  generateOtp(user: User): Observable<User> {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000;
    
    const updatedUser = { ...user, otp, otpExpiry };
    
    return this.http.put<User>(`${this.apiUrl}/${user.id}`, updatedUser).pipe(
      tap(updatedUser => {
        console.log(`OTP sent to user: ${otp}`);
        this.snackbar.open(`OTP sent to user: ${otp}`, 'Close', {
          duration: 3000
        });
      }),
      catchError(error => throwError(() => error))
    );
  }
  
  verifyOtp(email: string, otpToVerify: string): Observable<User> {
    return this.http.get<User[]>(`${this.apiUrl}?email=${email}`).pipe(
      switchMap(users => {
        if (users.length === 0) {
          return throwError(() => new Error('User not found'));
        }
        
        const user = users[0];
        
        if (!user.otp || user.otp !== otpToVerify) {
          return throwError(() => new Error('Invalid OTP'));
        }
        
        if (user.otpExpiry && user.otpExpiry < Date.now()) {
          return throwError(() => new Error('OTP expired'));
        }
        
        const verifiedUser = {
          ...user,
          isVerified: true,
          otp: '',
          otpExpiry: undefined
        };
        
        return this.http.put<User>(`${this.apiUrl}/${user.id}`, verifiedUser).pipe(
          tap(updatedUser => {
            const safeUser: User = { ...user, password: '', otp: '', otpExpiry: undefined };
            localStorage.setItem('currentUser', JSON.stringify(safeUser));
            this.currentUserSubject.next(safeUser);
          })
        );
      }),
      catchError(error => throwError(() => error))
    );
  }
  
  resendOtp(email: string): Observable<User> {
    return this.http.get<User[]>(`${this.apiUrl}?email=${email}`).pipe(
      switchMap(users => {
        if (users.length === 0) {
          return throwError(() => new Error('User not found'));
        }
        return this.generateOtp(users[0]);
      }),
      catchError(error => throwError(() => error))
    );
  }
  
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
}
