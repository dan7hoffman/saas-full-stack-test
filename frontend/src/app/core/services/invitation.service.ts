import { Injectable, signal } from '@angular/core';
import {
  Invitation,
  SendInvitationRequest,
  SendInvitationResponse,
  ListInvitationsResponse,
  AcceptInvitationResponse,
} from '@core/models/invitation.model';
import { environment } from '../../../environments/environment';

/**
 * InvitationService - Manage organization invitations
 *
 * Handles:
 * - Sending invitations to new members
 * - Listing invitations (pending, accepted, expired, revoked)
 * - Accepting invitations via token
 * - Revoking pending invitations
 *
 * Uses Angular Signals for reactive state
 */
@Injectable({
  providedIn: 'root',
})
export class InvitationService {
  private readonly API_URL = `${environment.apiUrl}/api/invitations`;

  // Reactive state using Angular Signals
  readonly invitations = signal<ListInvitationsResponse['data'] | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Send invitation to email address
   */
  async sendInvitation(request: SendInvitationRequest): Promise<SendInvitationResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      const data: SendInvitationResponse = await response.json();

      // Refresh invitations list
      await this.loadInvitations();

      return data;
    } catch (error: any) {
      this.error.set(error.message || 'Failed to send invitation');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Load invitations for current user's organization
   */
  async loadInvitations(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await fetch(this.API_URL, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load invitations');
      }

      const data: ListInvitationsResponse = await response.json();
      this.invitations.set(data.data);
    } catch (error: any) {
      this.error.set(error.message || 'Failed to load invitations');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Accept invitation via token
   */
  async acceptInvitation(token: string): Promise<AcceptInvitationResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await fetch(`${this.API_URL}/accept/${token}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept invitation');
      }

      const data: AcceptInvitationResponse = await response.json();
      return data;
    } catch (error: any) {
      this.error.set(error.message || 'Failed to accept invitation');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Revoke invitation
   */
  async revokeInvitation(invitationId: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await fetch(`${this.API_URL}/${invitationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to revoke invitation');
      }

      // Refresh invitations list
      await this.loadInvitations();
    } catch (error: any) {
      this.error.set(error.message || 'Failed to revoke invitation');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Validate invitation token (NO AUTH REQUIRED)
   * Used to get invitation details before registration
   */
  async validateInvitation(token: string): Promise<{
    email: string;
    role: string;
    organizationName: string;
    expiresAt: string;
  }> {
    try {
      const response = await fetch(`${this.API_URL}/validate/${token}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid invitation token');
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to validate invitation');
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }
}
