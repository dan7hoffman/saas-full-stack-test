import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Button, Input, Card } from '@ui';
import { AuthService } from '@core/services/auth.service';
import { InvitationService } from '@core/services/invitation.service';

/**
 * RegisterComponent - User registration page
 *
 * Features:
 * - Email, password, first name, last name fields
 * - Password strength validation
 * - Real-time validation feedback
 * - CSRF protection via AuthService
 * - Auto-creates organization on successful registration
 *
 * Matches LoginComponent styling (Stripe/Linear-inspired)
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Button, Input, Card],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div class="w-full max-w-md">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">{{ appName }}</h1>
          <p class="text-gray-600 mt-2">
            @if (invitationOrganizationName()) {
              Join {{ invitationOrganizationName() }}
            } @else {
              Create your account
            }
          </p>
        </div>

        <!-- Registration Card -->
        <app-card [hasHeader]="false" [hasFooter]="false">
          <div body>
            <form (ngSubmit)="handleRegister()" class="space-y-4">
              <!-- Name Fields (side by side) -->
              <div class="grid grid-cols-2 gap-4">
                <app-input
                  type="text"
                  label="First Name"
                  placeholder="John"
                  [(ngModel)]="firstName"
                  name="firstName"
                  [error]="firstNameError()"
                  [disabled]="isLoading()"
                  [required]="true" />

                <app-input
                  type="text"
                  label="Last Name"
                  placeholder="Doe"
                  [(ngModel)]="lastName"
                  name="lastName"
                  [error]="lastNameError()"
                  [disabled]="isLoading()"
                  [required]="true" />
              </div>

              <!-- Email Input -->
              <app-input
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                [(ngModel)]="email"
                name="email"
                [error]="emailError()"
                [disabled]="isLoading() || invitationOrganizationName() !== null"
                [required]="true" />

              <!-- Password Input -->
              <app-input
                type="password"
                label="Password"
                placeholder="At least 8 characters"
                [(ngModel)]="password"
                name="password"
                [error]="passwordError()"
                [disabled]="isLoading()"
                [required]="true" />

              <!-- Password Strength Indicator -->
              <div *ngIf="password.length > 0" class="space-y-1">
                <div class="flex gap-1">
                  <div
                    *ngFor="let segment of [0, 1, 2, 3]"
                    class="h-1 flex-1 rounded-full transition-colors"
                    [class.bg-red-500]="passwordStrength() >= 1 && segment === 0"
                    [class.bg-orange-500]="passwordStrength() >= 2 && segment === 1"
                    [class.bg-yellow-500]="passwordStrength() >= 3 && segment === 2"
                    [class.bg-green-500]="passwordStrength() === 4 && segment === 3"
                    [class.bg-gray-200]="segment >= passwordStrength()"></div>
                </div>
                <p class="text-xs text-gray-600">
                  Password strength: {{ passwordStrengthLabel() }}
                </p>
              </div>

              <!-- Confirm Password Input -->
              <app-input
                type="password"
                label="Confirm Password"
                placeholder="Re-enter your password"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                [error]="confirmPasswordError()"
                [disabled]="isLoading()"
                [required]="true" />

              <!-- Error Message -->
              <div
                *ngIf="generalError()"
                class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {{ generalError() }}
              </div>

              <!-- Success Message -->
              <div
                *ngIf="successMessage()"
                class="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                {{ successMessage() }}
              </div>

              <!-- Submit Button -->
              <app-button
                type="submit"
                variant="primary"
                [loading]="isLoading()"
                [disabled]="!isFormValid()"
                class="w-full">
                {{ isLoading() ? 'Creating account...' : 'Create Account' }}
              </app-button>
            </form>

            <!-- Login Link -->
            <div class="mt-6 text-center text-sm text-gray-600">
              Already have an account?
              <a
                routerLink="/auth/login"
                class="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </a>
            </div>
          </div>
        </app-card>
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  // Injected services
  private authService = inject(AuthService);
  private invitationService = inject(InvitationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Form data
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';

  // Invitation token from query params
  private inviteToken: string | null = null;
  invitationOrganizationName = signal<string | null>(null);

  // UI state (using Angular signals for reactivity)
  isLoading = signal(false);
  firstNameError = signal('');
  lastNameError = signal('');
  emailError = signal('');
  passwordError = signal('');
  confirmPasswordError = signal('');
  generalError = signal('');
  successMessage = signal('');

  // Config
  appName = 'SaaS Starter';

  /**
   * Calculate password strength (0-4)
   */
  passwordStrength = signal(0);

  /**
   * Initialize component - check for invitation token
   */
  async ngOnInit(): Promise<void> {
    // Check for invitation token in query params
    this.inviteToken = this.route.snapshot.queryParamMap.get('inviteToken');

    if (this.inviteToken) {
      try {
        // Validate invitation and pre-fill email
        const invitationDetails = await this.invitationService.validateInvitation(this.inviteToken);
        this.email = invitationDetails.email;
        this.invitationOrganizationName.set(invitationDetails.organizationName);
      } catch (error: any) {
        this.generalError.set(error.message || 'Invalid invitation link');
      }
    }
  }

  /**
   * Password strength label
   */
  passwordStrengthLabel(): string {
    const strength = this.passwordStrength();
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    return strength > 0 ? labels[strength - 1] : '';
  }

  /**
   * Update password strength when password changes
   */
  ngDoCheck(): void {
    this.calculatePasswordStrength();
  }

  /**
   * Calculate password strength based on criteria
   */
  private calculatePasswordStrength(): void {
    let strength = 0;

    if (this.password.length === 0) {
      this.passwordStrength.set(0);
      return;
    }

    // Length check
    if (this.password.length >= 8) strength++;
    if (this.password.length >= 12) strength++;

    // Character diversity checks
    if (/[a-z]/.test(this.password) && /[A-Z]/.test(this.password)) strength++;
    if (/[0-9]/.test(this.password)) strength++;
    if (/[^a-zA-Z0-9]/.test(this.password)) strength++;

    // Cap at 4
    this.passwordStrength.set(Math.min(strength, 4));
  }

  /**
   * Form validation
   */
  isFormValid(): boolean {
    return (
      this.firstName.length > 0 &&
      this.lastName.length > 0 &&
      this.email.length > 0 &&
      this.password.length >= 8 &&
      this.confirmPassword.length > 0 &&
      this.password === this.confirmPassword
    );
  }

  /**
   * Handle registration form submission
   */
  async handleRegister(): Promise<void> {
    // Reset errors
    this.firstNameError.set('');
    this.lastNameError.set('');
    this.emailError.set('');
    this.passwordError.set('');
    this.confirmPasswordError.set('');
    this.generalError.set('');
    this.successMessage.set('');

    // Validate
    if (!this.validateForm()) {
      return;
    }

    // Call API
    this.isLoading.set(true);

    try {
      await this.authService.register(
        this.email,
        this.password,
        this.firstName,
        this.lastName
      );

      // If invitation token exists, accept it automatically
      if (this.inviteToken) {
        try {
          await this.invitationService.acceptInvitation(this.inviteToken);
          this.successMessage.set(
            `Account created! You've been added to ${this.invitationOrganizationName() || 'the organization'}.`
          );
        } catch (inviteError: any) {
          // Log error but don't block user - they're already registered
          console.error('Failed to auto-accept invitation:', inviteError);
          this.successMessage.set(
            'Account created! Please check your email to verify your account.'
          );
        }
      } else {
        this.successMessage.set(
          'Account created! Please check your email to verify your account.'
        );
      }

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
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

    // First name validation
    if (!this.firstName.trim()) {
      this.firstNameError.set('First name is required');
      isValid = false;
    }

    // Last name validation
    if (!this.lastName.trim()) {
      this.lastNameError.set('Last name is required');
      isValid = false;
    }

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
    } else if (!/[A-Z]/.test(this.password)) {
      this.passwordError.set('Password must contain at least one uppercase letter');
      isValid = false;
    } else if (!/[a-z]/.test(this.password)) {
      this.passwordError.set('Password must contain at least one lowercase letter');
      isValid = false;
    } else if (!/[0-9]/.test(this.password)) {
      this.passwordError.set('Password must contain at least one number');
      isValid = false;
    } else if (!/[^a-zA-Z0-9]/.test(this.password)) {
      this.passwordError.set('Password must contain at least one special character');
      isValid = false;
    }

    // Confirm password validation
    if (!this.confirmPassword) {
      this.confirmPasswordError.set('Please confirm your password');
      isValid = false;
    } else if (this.password !== this.confirmPassword) {
      this.confirmPasswordError.set('Passwords do not match');
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
    if (error.status === 400 && error.error?.details) {
      // Validation errors from Zod
      const details = error.error.details;
      details.forEach((detail: any) => {
        const field = detail.field;
        const message = detail.message;

        switch (field) {
          case 'email':
            this.emailError.set(message);
            break;
          case 'password':
            this.passwordError.set(message);
            break;
          case 'firstName':
            this.firstNameError.set(message);
            break;
          case 'lastName':
            this.lastNameError.set(message);
            break;
        }
      });
    } else if (error.error?.error) {
      this.generalError.set(error.error.error);
    } else {
      this.generalError.set('An error occurred. Please try again.');
    }
  }
}
