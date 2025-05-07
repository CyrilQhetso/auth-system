import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-password-strength-meter',
  standalone: false,
  templateUrl: './password-strength-meter.component.html',
  styleUrl: './password-strength-meter.component.css'
})
export class PasswordStrengthMeterComponent implements OnChanges {

  @Input() password: string = '';
  strength: number = 0;
  feedback: string = '';
  
  ngOnChanges(): void {
    this.calculateStrength();
  }
  
  calculateStrength(): void {
    const password = this.password;
    
    if (!password) {
      this.strength = 0;
      this.feedback = '';
      return;
    }
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) score += 1;  // Has uppercase
    if (/[a-z]/.test(password)) score += 1;  // Has lowercase
    if (/[0-9]/.test(password)) score += 1;  // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 1;  // Has special character
    
    // Reduction for common patterns
    if (/(.)\1{2,}/.test(password)) score -= 1;  // Repeated characters
    if (/^(12345|qwerty|password|admin|welcome)/.test(password.toLowerCase())) score = 0;
    
    // Ensure score is between 0-5
    this.strength = Math.max(0, Math.min(5, score));
    
    // Set feedback message
    this.setFeedback();
  }
  
  setFeedback(): void {
    switch (this.strength) {
      case 0:
        this.feedback = 'Very Weak: This password is extremely vulnerable.';
        break;
      case 1:
        this.feedback = 'Weak: This password is easily guessable.';
        break;
      case 2:
        this.feedback = 'Fair: This password needs improvement.';
        break;
      case 3:
        this.feedback = 'Good: This password provides moderate security.';
        break;
      case 4:
        this.feedback = 'Strong: This password is quite secure.';
        break;
      case 5:
        this.feedback = 'Very Strong: Excellent password choice!';
        break;
    }
  }
  
  getColorClass(): string {
    switch (this.strength) {
      case 0: return 'very-weak';
      case 1: return 'weak';
      case 2: return 'fair';
      case 3: return 'good';
      case 4: return 'strong';
      case 5: return 'very-strong';
      default: return '';
    }
  }
  
  isLengthMet(): boolean {
    return this.password.length >= 8;
  }
  
  hasUppercase(): boolean {
    return /[A-Z]/.test(this.password);
  }
  
  hasLowercase(): boolean {
    return /[a-z]/.test(this.password);
  }
  
  hasNumber(): boolean {
    return /[0-9]/.test(this.password);
  }
  
  hasSpecialCharacter(): boolean {
    return /[^A-Za-z0-9]/.test(this.password);
  }
}
