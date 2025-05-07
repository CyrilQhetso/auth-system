import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { validatePassword } from '../../validators/password-validator';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;
  loading = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    const user = authService.currentUserValue;
    if (user && user.isVerified) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit(): void {
      this.registerForm = this.formBuilder.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [
          Validators.required,
          Validators.minLength(6),
          validatePassword
        ]],
        confirmPassword: ['', Validators.required]
      }, {
        validator: this.checkPasswords
      });
  }

  checkPasswords(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  get f() { return this.registerForm.controls };

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const user = {
      name: this.f['name'].value,
      email: this.f['email'].value,
      password: this.f['password'].value
    };

    this.authService.register(user).subscribe({
      next: () => {
        localStorage.setItem('verificationEmail', this.f['email'].value);
        this.router.navigate(['/verify-otp'], {
          queryParams: { isRegistration: 'true' }
        });
      },
      error: error => {
        this.error = error.message || 'Registration failed';
        this.loading = false;
      }
    });
  }
}
