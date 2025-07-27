import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest } from '../../../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor() {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        acceptTerms: [false, [Validators.requiredTrue]],
      },
      {
        validators: [this.passwordMatchValidator],
      }
    );
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  get firstNameControl() {
    return this.registerForm.get('firstName');
  }

  get lastNameControl() {
    return this.registerForm.get('lastName');
  }

  get emailControl() {
    return this.registerForm.get('email');
  }

  get passwordControl() {
    return this.registerForm.get('password');
  }

  get confirmPasswordControl() {
    return this.registerForm.get('confirmPassword');
  }

  get acceptTermsControl() {
    return this.registerForm.get('acceptTerms');
  }

  get isFormValid() {
    return this.registerForm.valid;
  }

  get passwordsMatch() {
    return !this.registerForm.errors?.['passwordMismatch'];
  }

  togglePasswordVisibility() {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((value) => !value);
  }

  onSubmit() {
    if (this.registerForm.invalid || this.isLoading()) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { firstName, lastName, email, password } = this.registerForm.value;

    const registerData: RegisterRequest = {
      firstName,
      lastName,
      email,
      password,
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.isLoading.set(false);

        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'An error occurred during registration');
      },
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  fillTestData() {
    this.registerForm.patchValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      password: 'password123',
      confirmPassword: 'password123',
      acceptTerms: true,
    });
  }
}