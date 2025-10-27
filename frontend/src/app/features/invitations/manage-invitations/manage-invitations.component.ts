import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvitationService } from '@core/services/invitation.service';
import {
  Invitation,
  OrganizationRole,
  SendInvitationRequest,
} from '@core/models/invitation.model';

/**
 * ManageInvitationsComponent - Organization invitation management
 *
 * Features:
 * - Send new invitations (ADMIN/OWNER only)
 * - View pending, accepted, expired, and revoked invitations
 * - Revoke pending invitations
 * - Tab-based interface for different invitation states
 *
 * Permissions:
 * - ADMIN and OWNER can send and revoke invitations
 * - MEMBER and VIEWER can only view invitations
 */
@Component({
  selector: 'app-manage-invitations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-invitations.component.html',
  styleUrls: ['./manage-invitations.component.css'],
})
export class ManageInvitationsComponent implements OnInit {
  readonly invitations = this.invitationService.invitations;
  readonly isLoading = this.invitationService.isLoading;
  readonly error = this.invitationService.error;

  // Form state
  readonly showInviteModal = signal(false);
  readonly inviteEmail = signal('');
  readonly inviteRole = signal<OrganizationRole>('MEMBER');
  readonly isSending = signal(false);
  readonly sendError = signal<string | null>(null);
  readonly sendSuccess = signal(false);

  // Tab state
  readonly activeTab = signal<'pending' | 'accepted' | 'expired' | 'revoked'>('pending');

  // Available roles for dropdown
  readonly availableRoles: OrganizationRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

  constructor(public invitationService: InvitationService) {}

  async ngOnInit(): Promise<void> {
    await this.loadInvitations();
  }

  async loadInvitations(): Promise<void> {
    try {
      await this.invitationService.loadInvitations();
    } catch (error) {
      // Error handled by service
    }
  }

  openInviteModal(): void {
    this.showInviteModal.set(true);
    this.inviteEmail.set('');
    this.inviteRole.set('MEMBER');
    this.sendError.set(null);
    this.sendSuccess.set(false);
  }

  closeInviteModal(): void {
    this.showInviteModal.set(false);
    this.inviteEmail.set('');
    this.inviteRole.set('MEMBER');
    this.sendError.set(null);
    this.sendSuccess.set(false);
  }

  async sendInvitation(): Promise<void> {
    this.sendError.set(null);
    this.sendSuccess.set(false);

    const email = this.inviteEmail().trim();
    if (!email) {
      this.sendError.set('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.sendError.set('Please enter a valid email address');
      return;
    }

    this.isSending.set(true);

    try {
      const request: SendInvitationRequest = {
        email,
        role: this.inviteRole(),
      };

      await this.invitationService.sendInvitation(request);
      this.sendSuccess.set(true);

      // Close modal after 2 seconds
      setTimeout(() => {
        this.closeInviteModal();
      }, 2000);
    } catch (error: any) {
      this.sendError.set(error.message || 'Failed to send invitation');
    } finally {
      this.isSending.set(false);
    }
  }

  async revokeInvitation(invitation: Invitation): Promise<void> {
    if (!confirm(`Are you sure you want to revoke the invitation to ${invitation.email}?`)) {
      return;
    }

    try {
      await this.invitationService.revokeInvitation(invitation.id);
    } catch (error) {
      // Error handled by service
    }
  }

  setActiveTab(tab: 'pending' | 'accepted' | 'expired' | 'revoked'): void {
    this.activeTab.set(tab);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getRoleColor(role: OrganizationRole): string {
    const colors: Record<OrganizationRole, string> = {
      OWNER: '#e91e63',
      ADMIN: '#ff9800',
      MEMBER: '#4caf50',
      VIEWER: '#2196f3',
    };
    return colors[role];
  }

  getRoleDescription(role: OrganizationRole): string {
    const descriptions: Record<OrganizationRole, string> = {
      OWNER: 'Full access and can manage organization',
      ADMIN: 'Can manage members and all data',
      MEMBER: 'Can create and edit data',
      VIEWER: 'View-only access',
    };
    return descriptions[role];
  }

  getInvitationsForActiveTab(): Invitation[] {
    const data = this.invitations();
    if (!data) return [];

    switch (this.activeTab()) {
      case 'pending':
        return data.pending;
      case 'accepted':
        return data.accepted;
      case 'expired':
        return data.expired;
      case 'revoked':
        return data.revoked;
      default:
        return [];
    }
  }

  getTabCount(tab: 'pending' | 'accepted' | 'expired' | 'revoked'): number {
    const data = this.invitations();
    if (!data) return 0;
    return data[tab].length;
  }
}
