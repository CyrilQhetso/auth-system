import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnInit {

  forgotPasswordForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) { }
  
  ngOnInit() {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }
  
  // convenience getter for easy access to form fields
  get f() { return this.forgotPasswordForm.controls; }
  
  onSubmit() {
    this.submitted = true;
    
    // stop here if form is invalid
    if (this.forgotPasswordForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.success = '';
    
    this.authService.requestPasswordReset(this.f['email'].value).subscribe({
      next: (response) => {
        this.success = response.message;
        this.loading = false;
        
        // Redirect to OTP verification after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/verify-otp'], {
            queryParams: {
              email: this.f['email'].value,
              mode: 'reset'
            }
          });
        }, 2000);
      },
      error: error => {
        this.error = error.message;
        this.loading = false;
      }
    });
  }
}
