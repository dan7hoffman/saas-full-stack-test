import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button, Input, Card } from '@ui';
import { AuthService } from '@core/services/auth.service';

/**
 * LoginComponent - Layer 3 (Feature Composition)
 *
 * Demonstrates 3-layer composition:
 * - Uses Layer 2 components (Button, Input, Card)
 * - Contains business logic (validation, API calls)
 * - No low-level styling
 *
 * Stripe/Linear-inspired design
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Button, Input, Card],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="w-full max-w-md">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">{{ appName }}</h1>
          <p class="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <!-- Login Card -->
        <app-card [hasHeader]="false" [hasFooter]="false">
          <div body>
            <form (ngSubmit)="handleLogin()" class="space-y-4">
              <!-- Email Input -->
              <app-input
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                [(ngModel)]="email"
                name="email"
                [error]="emailError()"
                [disabled]="isLoading()"
                [required]="true" />

              <!-- Password Input -->
              <app-input
                type="password"
                label="Password"
                placeholder="Enter your password"
                [(ngModel)]="password"
                name="password"
                [error]="passwordError()"
                [disabled]="isLoading()"
                [required]="true" />

              <!-- Error Message -->
              <div
                *ngIf="generalError()"
                class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {{ generalError() }}
              </div>

              <!-- Submit Button -->
              <app-button
                type="submit"
                variant="primary"
                [loading]="isLoading()"
                [disabled]="!isFormValid()"
                class="w-full">
                {{ isLoading() ? 'Signing in...' : 'Sign In' }}
              </app-button>
            </form>

            <!-- Divider -->
            <div class="mt-6 text-center">
              <a
                routerLink="/auth/forgot-password"
                class="text-sm text-primary-600 hover:text-primary-700">
                Forgot your password?
              </a>
            </div>

            <!-- Register Link -->
            <div class="mt-4 text-center text-sm text-gray-600">
              Don't have an account?
              <a
                routerLink="/auth/register"
                class="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </a>
            </div>
          </div>
        </app-card>

        <!-- Demo Credentials (dev only) -->
        <div
          *ngIf="isDevelopment"
          class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p class="font-semibold text-blue-900 mb-2">Demo Credentials:</p>
          <p class="text-blue-800">Email: admin&#64;example.com</p>
          <p class="text-blue-800">Password: Admin123!&#64;#$</p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  // Injected services (using inject() function for modern Angular)
  private authService = inject(AuthService);
  private router = inject(Router);

  // Form data
  email = '';
  password = '';

  // UI state (using Angular signals for reactivity)
  isLoading = signal(false);
  emailError = signal('');
  passwordError = signal('');
  generalError = signal('');

  // Config
  appName = 'SaaS Starter';
  isDevelopment = true; // In real app: environment.production === false

  /**
   * Form validation
   */
  isFormValid(): boolean {
    return this.email.length > 0 && this.password.length > 0;
  }

  /**
   * Handle login form submission
   */
  async handleLogin(): Promise<void> {
    // Reset errors
    this.emailError.set('');
    this.passwordError.set('');
    this.generalError.set('');

    // Validate
    if (!this.validateForm()) {
      return;
    }

    // Call API
    this.isLoading.set(true);

    try {
      await this.authService.login(this.email, this.password);

      // Success! Redirect to dashboard
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.handleError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Validate form fields
   */
  private validateForm(): boolean {
    let isValid = true;

    // Email validation
    if (!this.email) {
      this.emailError.set('Email is required');
      isValid = false;
    } else if (!this.isValidEmail(this.email)) {
      this.emailError.set('Please enter a valid email address');
      isValid = false;
    }

    // Password validation
    if (!this.password) {
      this.passwordError.set('Password is required');
      isValid = false;
    } else if (this.password.length < 8) {
      this.passwordError.set('Password must be at least 8 characters');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): void {
    if (error.status === 401) {
      this.generalError.set('Invalid email or password');
    } else if (error.status === 423) {
      this.generalError.set(
        'Account locked due to too many failed attempts. Please try again later.'
      );
    } else if (error.error?.error) {
      this.generalError.set(error.error.error);
    } else {
      this.generalError.set('An error occurred. Please try again.');
    }
  }
}
