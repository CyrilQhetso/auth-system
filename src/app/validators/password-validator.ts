import { AbstractControl, ValidationErrors } from '@angular/forms';

export function validatePassword(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    
    if (!password) return null;
    
    const errors: ValidationErrors = {};
    let isValid = true;
    
    // Check for minimum length
    if (password.length < 8) {
        errors['minLength'] = true;
        isValid = false;
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
        errors['uppercase'] = true;
        isValid = false;
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
        errors['lowercase'] = true;
        isValid = false;
    }

    // Check for numbers
    if (!/[0-9]/.test(password)) {
        errors['number'] = true;
        isValid = false;
    }

    // Check for special characters
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors['special'] = true;
        isValid = false;
    }

    // Check for common passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'welcome'];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors['common'] = true;
        isValid = false;
    }

    return isValid ? null : errors;
}