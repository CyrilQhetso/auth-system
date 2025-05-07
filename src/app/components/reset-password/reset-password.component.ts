import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {

  resetPasswordForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  email = '';
  otp = '';
  
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }
  
  ngOnInit() {
    // Get email and OTP from query params
    this.email = this.route.snapshot.queryParams['email'] || '';
    this.otp = this.route.snapshot.queryParams['otp'] || '';
    
    if (!this.email || !this.otp) {
      this.error = 'Invalid reset link. Please request a new password reset.';
    }
    
    this.resetPasswordForm = this.formBuilder.group({
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.checkPasswords
    });
  }
  
  // Check if passwords match
  checkPasswords(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { notMatching: true };
  }
  
  // convenience getter for easy access to form fields
  get f() { return this.resetPasswordForm.controls; }
  
  onSubmit() {
    this.submitted = true;
    
    // stop here if form is invalid
    if (this.resetPasswordForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.success = '';
    
    this.authService.resetPassword(this.email, this.otp, this.f['password'].value).subscribe({
      next: (response) => {
        this.success = response.message;
        this.loading = false;
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: error => {
        this.error = error.message;
        this.loading = false;
      }
    });
  }
}
