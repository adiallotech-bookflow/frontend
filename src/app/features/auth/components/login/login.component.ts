import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['admin@test.com', [Validators.required, Validators.email]],
      password: ['password123', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  get isFormValid() {
    return this.loginForm.valid;
  }

  togglePasswordVisibility() {
    this.showPassword.update((value) => !value);
  }

  onSubmit() {
    if (this.loginForm.invalid || this.isLoading()) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading.set(false);

        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'An error occurred during login');
      },
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  loginAs(userType: 'admin' | 'professional' | 'customer') {
    const credentials = {
      admin: { email: 'admin@test.com', password: 'password123' },
      professional: { email: 'professional@test.com', password: 'password123' },
      customer: { email: 'customer@test.com', password: 'password123' },
    };

    const cred = credentials[userType];
    this.loginForm.patchValue({
      email: cred.email,
      password: cred.password,
    });
    this.onSubmit();
  }
}