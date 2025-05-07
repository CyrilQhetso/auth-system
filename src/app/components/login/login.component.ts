import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) { }
  
  ngOnInit() {
    // Initialize the login form
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    
    // Check if already logged in
    this.authService.currentUser.subscribe(user => {
      if (user && user.isVerified) {
        this.router.navigate(['/dashboard']);
      }
    });
  }
  
  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }
  
  onSubmit() {
    this.submitted = true;
    
    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.authService.login(this.f['email'].value, this.f['password'].value).subscribe({
      next: (user) => {
        // This should only be called for successful login
        console.log('Login successful:', user);
        this.router.navigate(['/dashboard']);
      },
      error: error => {
        if (error.message === 'TWO_FACTOR_AUTHENTICATION_REQUIRED') {
          // Redirect to OTP verification for 2FA
          this.router.navigate(['/verify-otp'], {
            queryParams: {
              email: this.f['email'].value,
              mode: '2fa'
            }
          });
        } else if (error.message.includes('User not verified')) {
          // Redirect to OTP verification for account verification
          this.router.navigate(['/verify-otp'], {
            queryParams: {
              email: this.f['email'].value,
              mode: 'verify'
            }
          });
        } else {
          this.error = error.message;
        }
        this.loading = false;
      }
    });
  }
}