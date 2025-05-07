import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-otp-verification',
  standalone: false,
  templateUrl: './otp-verification.component.html',
  styleUrl: './otp-verification.component.css'
})
export class OtpVerificationComponent implements OnInit {

  otpForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  email = '';
  mode: 'verify' | 'reset' | '2fa' = 'verify';
  currentOtp: string = ''; // Add this property to store and display the OTP
  
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    protected userService: UserService,
    private snackBar: MatSnackBar
  ) { }
  
  ngOnInit() {
    this.email = this.route.snapshot.queryParams['email'] || '';
    this.mode = this.route.snapshot.queryParams['mode'] || 'verify';
    
    this.otpForm = this.formBuilder.group({
      email: [this.email, [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });
    
    // If email is provided in query params, disable the field
    if (this.email) {
      this.otpForm.get('email')?.disable();
      
      // Get the current OTP for this email when component initializes
      this.fetchCurrentOtp(this.email);
    }
  }
  
  // Method to fetch and display the current OTP
  fetchCurrentOtp(email: string) {
    if (!email) return;
    
    this.userService.getUserByEmail(email).subscribe({
      next: (users) => {
        if (users && users.otp) {
          this.currentOtp = users.otp;
        }
      },
      error: (error) => {
        console.error('Error fetching OTP:', error);
      }
    });
  }
  
  // convenience getter for easy access to form fields
  get f() { return this.otpForm.controls; }
  
  onSubmit() {
    this.submitted = true;
    
    // stop here if form is invalid
    if (this.otpForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    const email = this.f['email'].value;
    const otp = this.f['otp'].value;
    
    switch (this.mode) {
      case 'verify':
        this.verifyOtp(email, otp);
        break;
      case 'reset':
        this.router.navigate(['/reset-password'], { queryParams: { email, otp } });
        break;
      case '2fa':
        this.verify2FA(email, otp);
        break;
    }
  }
  
  private verifyOtp(email: string, otp: string) {
    this.authService.verifyOtp(email, otp).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: error => {
        this.error = error.message;
        this.loading = false;
      }
    });
  }
  
  private verify2FA(email: string, otp: string) {
    this.authService.verifyTwoFA(email, otp).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: error => {
        this.error = error.message;
        this.loading = false;
      }
    });
  }
  
  resendOtp() {
    const email = this.f['email'].value;
    
    if (!email) {
      this.error = 'Please enter an email address';
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.authService.resendOtp(email).subscribe({
      next: (user) => {
        this.loading = false;
        if (user && user.otp) {
          this.currentOtp = user.otp;
        }
        this.snackBar.open('A new OTP has been sent to your email', 'Close', {
          duration: 5000
        });
      },
      error: error => {
        this.error = error.message;
        this.loading = false;
      }
    });
  }
  
  copyOtpToClipboard() {
    navigator.clipboard.writeText(this.currentOtp).then(() => {
      this.snackBar.open('OTP copied to clipboard', 'Close', {
        duration: 3000
      });
    });
  }
  
  // Auto-fill the OTP code into the form field
  fillOtp() {
    this.otpForm.get('otp')?.setValue(this.currentOtp);
  }
}