import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button, Input, Card } from '@ui';

/**
 * ForgotPasswordComponent - Password reset request page
 *
 * Features:
 * - Email input for password reset
 * - Sends reset link to user's email
 * - Success/error feedback
 * - Prevention of email enumeration (always shows success)
 *
 * Matches LoginComponent styling (Stripe/Linear-inspired)
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Button, Input, Card],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="w-full max-w-md">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">{{ appName }}</h1>
          <p class="text-gray-600 mt-2">Reset your password</p>
        </div>

        <!-- Forgot Password Card -->
        <app-card [hasHeader]="false" [hasFooter]="false">
          <div body>
            <!-- Show form if not submitted -->
            <form *ngIf="!isSubmitted()" (ngSubmit)="handleSubmit()" class="space-y-4">
              <p class="text-sm text-gray-600 mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>

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
                {{ isLoading() ? 'Sending...' : 'Send Reset Link' }}
              </app-button>
            </form>

            <!-- Success Message (after submission) -->
            <div *ngIf="isSubmitted()" class="space-y-4">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-start">
                  <span class="text-green-600 text-xl mr-3">✓</span>
                  <div>
                    <p class="text-sm font-medium text-green-900 mb-1">Check your email</p>
                    <p class="text-sm text-green-700">
                      If an account exists for <strong>{{ email }}</strong>, you will receive a password reset link shortly.
                    </p>
                  </div>
                </div>
              </div>

              <p class="text-xs text-gray-600 text-center">
                Didn't receive an email? Check your spam folder or
                <button
                  (click)="resetForm()"
                  class="text-primary-600 hover:text-primary-700 font-medium underline">
                  try again
                </button>
              </p>
            </div>

            <!-- Back to Login Link -->
            <div class="mt-6 text-center">
              <a
                routerLink="/auth/login"
                class="text-sm text-primary-600 hover:text-primary-700">
                ← Back to login
              </a>
            </div>
          </div>
        </app-card>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  // Form data
  email = '';

  // UI state (using Angular signals for reactivity)
  isLoading = signal(false);
  isSubmitted = signal(false);
  emailError = signal('');
  generalError = signal('');

  // Config
  appName = 'SaaS Starter';

  /**
   * Form validation
   */
  isFormValid(): boolean {
    return this.email.length > 0 && this.isValidEmail(this.email);
  }

  /**
   * Handle form submission
   */
  async handleSubmit(): Promise<void> {
    // Reset errors
    this.emailError.set('');
    this.generalError.set('');

    // Validate
    if (!this.validateForm()) {
      return;
    }

    // Call API
    this.isLoading.set(true);

    try {
      // Real API call to backend
      const response = await fetch('http://localhost:3000/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: this.email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw { status: response.status, error };
      }

      // Always show success message (prevent email enumeration)
      this.isSubmitted.set(true);
    } catch (error: any) {
      // Even on error, show success message (security best practice)
      // This prevents attackers from determining which emails are registered
      this.isSubmitted.set(true);
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
   * Reset form to try again
   */
  resetForm(): void {
    this.isSubmitted.set(false);
    this.email = '';
    this.emailError.set('');
    this.generalError.set('');
  }
}
