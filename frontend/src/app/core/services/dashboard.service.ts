import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Dashboard Statistics Interface
 * Matches backend DashboardController getStats() response
 */
export interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  userSessions: number;
  accountAgeDays: number;
  daysSinceLastLogin: number | null;
}

/**
 * User Profile Interface
 * Matches backend DashboardController getMe() response
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

/**
 * API Response Wrapper
 * Backend returns data with metadata
 */
interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
}

/**
 * Dashboard Service
 *
 * Handles API calls to dashboard endpoints:
 * - GET /api/dashboard/stats - Aggregated statistics
 * - GET /api/dashboard/me - Current user profile
 *
 * Features:
 * - Automatic CSRF token inclusion (via HttpClient interceptor)
 * - Cookie-based authentication (credentials: 'include')
 * - Error handling with RxJS catchError
 * - TypeScript type safety with interfaces
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/dashboard`;

  /**
   * Get Dashboard Statistics
   *
   * Fetches aggregated metrics for the dashboard:
   * - Total users in the system
   * - Active sessions count
   * - Current user's session count
   * - Account age in days
   * - Days since last login
   *
   * @returns Observable<DashboardStats>
   * @throws Error if request fails or user is unauthorized
   */
  getStats(): Observable<DashboardStats> {
    return this.http
      .get<ApiResponse<DashboardStats>>(`${this.apiUrl}/stats`, {
        withCredentials: true, // Include session cookie
      })
      .pipe(
        map((response) => response.data), // Extract data from wrapper
        catchError((error) => {
          console.error('Failed to fetch dashboard stats:', error);
          return throwError(
            () =>
              new Error(
                error.error?.message || 'Failed to load dashboard statistics'
              )
          );
        })
      );
  }

  /**
   * Get Current User Profile
   *
   * Fetches the authenticated user's profile information including:
   * - User ID, email, name
   * - Role (USER, ADMIN, SUPER_ADMIN)
   * - Email verification status
   * - Account creation and update timestamps
   * - Last login timestamp
   *
   * @returns Observable<UserProfile>
   * @throws Error if request fails or user is unauthorized
   */
  getProfile(): Observable<UserProfile> {
    return this.http
      .get<ApiResponse<UserProfile>>(`${this.apiUrl}/me`, {
        withCredentials: true, // Include session cookie
      })
      .pipe(
        map((response) => response.data), // Extract data from wrapper
        catchError((error) => {
          console.error('Failed to fetch user profile:', error);
          return throwError(
            () => new Error(error.error?.message || 'Failed to load user profile')
          );
        })
      );
  }
}
