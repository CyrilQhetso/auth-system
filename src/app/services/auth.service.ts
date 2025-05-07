import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
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
      let storedUser = null;
  
      try {
        const storedUserString = localStorage.getItem('currentUser');
        if (storedUserString) {
          storedUser = JSON.parse(storedUserString);
          console.log('Parsed storedUser:', storedUser);
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
  
      this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
      this.currentUser = this.currentUserSubject.asObservable();
  
      console.log('AuthService initialized with user:', this.currentUserSubject.value);
  }

    public get currentUserValue(): User | null {
      return this.currentUserSubject.value;
    }

    updateCurrentUserValue(user: User): void {
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
    }

    register(user: User): Observable<User> {
        const newUser: User = {
            ...user,
            isVerified: false,
            role: 'user',
            twoFactorEnabled: false,
            loginAttempts: 0,
            theme: 'light',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        return this.http.post<User>(this.apiUrl, newUser).pipe(
            map(user => {
                this.generateOtp(user);
                return user;
            }),
            catchError(error => throwError(() => error))
        );
    }

    login(email: string, password: string): Observable<User> {
      return this.http.get<User[]>(`${this.apiUrl}?email=${email}`).pipe(
        switchMap(users => {
          if (users.length === 0) {
            return throwError(() => new Error('Invalid email or password'));
          }
    
          const user = users[0];
    
          // Check if password matches
          if (user.password !== password) {
            return this.handleFailedLogin(user).pipe(
              switchMap(() => throwError(() => new Error('Invalid email or password')))
            );
          }
    
          // Check if account is locked
          if (user.lockedUntil && user.lockedUntil > Date.now()) {
            const remainingTime = Math.ceil((user.lockedUntil - Date.now()) / 60000);
            return throwError(() => new Error(`Account is locked. Try again in ${remainingTime} minutes.`));
          }
    
          // Reset login attempts if successful login
          if (user.loginAttempts && user.loginAttempts > 0) {
            const resetUser = { ...user, loginAttempts: 0, lockedUntil: null };
            this.http.put<User>(`${this.apiUrl}/${user.id}`, resetUser).subscribe();
          }
    
          // Check if account is verified
          if (!user.isVerified) {
            this.generateOtp(user).subscribe();
            return throwError(() => new Error('User not verified. OTP sent.'));
          }
    
          // Check two factor auth
          if (user.twoFactorEnabled) {
            this.generateOtp(user).subscribe();
            return throwError(() => new Error('TWO_FACTOR_AUTHENTICATION_REQUIRED'));
          }
    
          // Update last login timestamp
          const updatedUser = { ...user, lastLogin: Date.now() };
          return this.http.put<User>(`${this.apiUrl}/${user.id}`, updatedUser).pipe(
            map(returnedUser => {
              const safeUser: User = {
                ...returnedUser,
                password: '',
                otp: '',
                otpExpiry: 0
              };
              localStorage.setItem('currentUser', JSON.stringify(safeUser));
              this.currentUserSubject.next(safeUser);
              return returnedUser;
            })
          );
        }),
        catchError(error => throwError(() => error))
      );
    }

    private handleFailedLogin(user: User): Observable<never> {
        const loginAttempts = (user.loginAttempts || 0) + 1;
        let lockedUntil = null;

        if (loginAttempts >= 5) {
            // Lock account for 30 mins
            lockedUntil = Date.now() + 30 * 60 * 1000;
        }

        const updatedUser = { ...user, loginAttempts, lockedUntil };

        return this.http.put<User>(`${this.apiUrl}/${user.id}`, updatedUser).pipe(
            map(() => {
                if (lockedUntil) {
                    throw new Error('Too many failed login attempts. Your account has been locked for 30 minutes');
                } else {
                    const remainingAttempts = 5 - loginAttempts;
                    throw new Error(`Invalid username or password. You have ${remainingAttempts} attempts before account is locked`);
                }
            }),
            catchError(error => throwError(() => error))
        );
    }

    generateOtp(user: User): Observable<User> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 10 * 60 * 1000;

        const updatedUser = { ...user, otp, otpExpiry };

        return this.http.put<User>(`${this.apiUrl}/${user.id}`, updatedUser).pipe(
            map(user => {
                this.snackbar.open(`OTP for ${user.email}: ${otp}`, 'Close', {
                  duration: 5000
                });
                return user;
            }),
            catchError(error => throwError(() => error))
        );
    }

    verifyOtp(email: string, otp: string): Observable<User> {
      return this.http.get<User[]>(`${this.apiUrl}?email=${email}`).pipe(
          switchMap(users => {
              if (users.length === 0) {
                  return throwError(() => new Error('User not found'));
              }
  
              const user = users[0];
  
              if (!user.otp || user.otp !== otp) {
                  return throwError(() => new Error('Invalid OTP'));
              }
              if (!user.otpExpiry || user.otpExpiry < Date.now()) {
                  throw new Error('OTP has expired');
              }
  
              const updatedUser: User = {
                  ...user,
                  isVerified: true,
                  otp: '',
                  otpExpiry: 0,
                  lastLogin: Date.now(),
                  updatedAt: Date.now()
              };
              
              return this.http.put<User>(`${this.apiUrl}/${user.id}`, updatedUser).pipe(
                  map(user => {
                      // Create a safe user object without sensitive information
                      const safeUser: User = {
                          ...user,
                          password: '',
                          otp: '',
                          otpExpiry: 0
                      };
                      
                      // Store in localStorage and update the BehaviorSubject
                      localStorage.setItem('currentUser', JSON.stringify(safeUser));
                      this.currentUserSubject.next(safeUser);
                      
                      return user;
                  })
              );
          }),
          catchError(error => throwError(() => error))
      );
  }

    verifyTwoFA(email: string, otp: string): Observable<User> {
        return this.verifyOtp(email, otp);
    }

    requestPasswordReset(email: string): Observable<any> {
        return this.http.get<User[]>(`${this.apiUrl}?email=${email}`).pipe(
            map(users => {
                if (users.length === 0) {
                    throw new Error('Email not found');
                }

                const user = users[0];

                // Generate OTP for password reset
                return this.generateOtp(user).pipe(
                    map(otp => ({ message: 'Password reset OTP sent to your email', otp }))
                );
            }),
            catchError(error => throwError(() => error))
        );
    }

    resetPassword(email: string, otp: string, newPassword: string): Observable<any> {
        return this.http.get<User[]>(`${this.apiUrl}?email=${email}`).pipe(
            switchMap(users => {
                if (users.length === 0) {
                    throw new Error('User not found');
                }

                const user = users[0];

                // Check if OTP has expired
                if (!user.otpExpiry || user.otpExpiry < Date.now()) {
                    return throwError(() => new Error('OTP expired. Please request new OTP'));
                }

                // Validate the OTP is valid
                if (!user.otp || user.otp !== otp) {
                    return throwError(() => new Error('Invalid OTP'));
                }

                // Update password and clear OTP
                const updatedUser: User = {
                    ...user,
                    password: newPassword,
                    otp: '',
                    otpExpiry: 0,
                    updatedAt: Date.now()
                };

                return this.http.put<User>(`${this.apiUrl}/${user.id}`, updatedUser).pipe(
                    map(() => ({ message: 'Password reset successful' }))
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
