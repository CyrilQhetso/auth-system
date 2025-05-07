import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  profileForm!: FormGroup;
  currentUser: User | null = null;
  loading = false;
  successMessage = '';
  errorMessage = '';
  editMode = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService
  ) { }
  
  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.initForm();
    });
  }
  
  initForm(): void {
    if (!this.currentUser) return;
    
    this.profileForm = this.formBuilder.group({
      name: [this.currentUser.name, Validators.required],
      email: [{value: this.currentUser.email, disabled: true}, [Validators.required, Validators.email]],
      bio: [this.currentUser.bio || ''],
      profileImage: [this.currentUser.profileImage || ''],
      theme: [this.currentUser.theme || 'light']
    });
  }
  
  toggleEditMode(): void {
    this.editMode = !this.editMode;
  }
  
  onSubmit(): void {
    if (this.profileForm.invalid) return;
  
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
  
    const profileData: Partial<User> = {
      name: this.profileForm.value.name,
      bio: this.profileForm.value.bio,
      profileImage: this.profileForm.value.profileImage,
      theme: this.profileForm.value.theme,
    }


    this.userService.updateUserProfile(profileData).subscribe({
      next: (user) => {
        this.loading = false;
        this.successMessage = 'Profile updated successfully!';
        this.editMode = false;
  
        // Update the user in localStorage and the behavior subject
        const safeUser: Partial<User> = {
          ...user,
          otp: '',
          otpExpiry: undefined
        };
        delete (safeUser as any).password;
        localStorage.setItem('currentUser', JSON.stringify(safeUser));
        this.authService.updateCurrentUserValue(safeUser as User);
        this.currentUser = safeUser as User;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Failed to update profile';
      }
    });
  }
  
  
  changeTheme(theme: 'light' | 'dark' | 'system'): void {
    if (!this.currentUser) return;
    
    const updatedUser: User = {
      ...this.currentUser,
      theme,
      updatedAt: Date.now()
    };
    
    this.userService.updateUser(updatedUser).subscribe({
      next: (user) => {
        const safeUser: Partial<User> = {
          ...user,
          otp: '',
          otpExpiry: undefined
        };
        delete (safeUser as any).password;
        localStorage.setItem('currentUser', JSON.stringify(safeUser));
        this.authService.updateCurrentUserValue(safeUser as User);
        this.currentUser = safeUser as User;
        document.body.className = theme === 'system' ? this.getSystemTheme() : theme;
      }
    });
  }
  
  getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  // Placeholder for profile image upload
  uploadProfileImage(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // In a real app, you'd upload this to a server
        // For this demo, we'll just store the base64 string
        const profileImage = e.target?.result as string;
        this.profileForm.patchValue({ profileImage });
      };
      reader.readAsDataURL(file);
    }
  }

  toggleTwoFactor(event: any): void {
    const isEnabled = event.target.checked;

    if (!this.currentUser) return;

    const updatedUser: User = {
      ...this.currentUser,
      twoFactorEnabled: isEnabled,
      updatedAt: Date.now()
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: (user) => {
        const safeUser: Partial<User> = {
          ...user,
          otp: '',
          otpExpiry: undefined
        };
        delete (safeUser as any).password;
        localStorage.setItem('currentUser', JSON.stringify(safeUser));
        this.authService.updateCurrentUserValue(safeUser as User);
        this.currentUser = safeUser as User;

        this.successMessage = `Two-factor authentication ${isEnabled  ? 'enabled' : 'disabled'} successfully!`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error : (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Two-factor authentication failed.';
      }
    });
  }
}
