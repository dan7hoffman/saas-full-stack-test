import { Injectable, signal } from '@angular/core';
import { User, LoginRequest, AuthResponse } from '@core/models/user.model';

/**
 * AuthService - Core authentication service
 *
 * Handles:
 * - Login/logout
 * - User state management (Angular signals)
 * - Session persistence
 * - API communication with backend
 *
 * Uses Angular Signals for reactive state (modern approach)
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Reactive state using Angular Signals
  private userSignal = signal<User | null>(null);
  private loadingSignal = signal(false);

  // Public readonly signals
  readonly user = this.userSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();

  // CSRF token storage
  private csrfToken: string | null = null;

  // Computed values
  get isLoggedIn(): boolean {
    return this.user() !== null;
  }

  get currentUser(): User | null {
    return this.user();
  }

  constructor() {
    // Check for existing session on init (defer to avoid change detection error)
    setTimeout(() => {
      this.checkSession();
      this.fetchCsrfToken();
    }, 0);
  }

  /**
   * Fetch CSRF token from backend
   */
  private async fetchCsrfToken(): Promise<void> {
    try {
      const response = await fetch('http://localhost:3000/api/auth/csrf-token', {
        credentials: 'include',
      });
      const data = await response.json();
      this.csrfToken = data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token', error);
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<User> {
    this.loadingSignal.set(true);

    try {
      // Ensure we have a CSRF token
      if (!this.csrfToken) {
        await this.fetchCsrfToken();
      }

      // Real API call to backend
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': this.csrfToken || '',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw { status: response.status, error };
      }

      const data: AuthResponse = await response.json();

      // Update state
      this.userSignal.set(data.user);

      // Persist session
      this.saveSession(data.user);

      return data.user;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<User> {
    this.loadingSignal.set(true);

    try {
      // TODO: Replace with real API call
      // const response = await fetch('http://localhost:3000/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include',
      //   body: JSON.stringify({ email, password, firstName, lastName }),
      // });

      // if (!response.ok) {
      //   const error = await response.json();
      //   throw { status: response.status, error };
      // }

      // const data: AuthResponse = await response.json();

      // MOCK: Simulate API call
      await this.delay(1000);

      const mockUser: User = {
        id: '2',
        email,
        firstName,
        lastName,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.userSignal.set(mockUser);
      this.saveSession(mockUser);

      return mockUser;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    this.loadingSignal.set(true);

    try {
      // Call backend logout endpoint
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Clear state
      this.userSignal.set(null);
      this.clearSession();
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Check if user has active session
   */
  private async checkSession(): Promise<void> {
    // Check localStorage first (faster)
    const savedUser = this.loadSession();
    if (savedUser) {
      this.userSignal.set(savedUser);

      // Validate session with backend
      try {
        const response = await fetch('http://localhost:3000/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          this.userSignal.set(data.user);
        } else {
          this.clearSession();
          this.userSignal.set(null);
        }
      } catch {
        this.clearSession();
        this.userSignal.set(null);
      }
    }
  }

  /**
   * Save session to localStorage (optional, for faster page loads)
   */
  private saveSession(user: User): void {
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save session', error);
    }
  }

  /**
   * Load session from localStorage
   */
  private loadSession(): User | null {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        return JSON.parse(saved) as User;
      }
    } catch (error) {
      console.error('Failed to load session', error);
    }
    return null;
  }

  /**
   * Clear session from localStorage
   */
  private clearSession(): void {
    try {
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Failed to clear session', error);
    }
  }

  /**
   * Utility: Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
