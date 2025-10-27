import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitationService } from '@core/services/invitation.service';
import { AuthService } from '@core/services/auth.service';

/**
 * AcceptInviteComponent - Accept organization invitation
 *
 * Flow:
 * 1. Extract token from URL query parameter
 * 2. Check if user is logged in
 * 3. If NOT logged in → redirect to register with email pre-filled
 * 4. If logged in → validate token and accept invitation
 * 5. Show success message with organization details
 * 6. Redirect to dashboard
 *
 * Error handling:
 * - Invalid/expired token
 * - Email mismatch (invitation for different user)
 * - Already accepted
 */
@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accept-invite.component.html',
  styleUrls: ['./accept-invite.component.css'],
})
export class AcceptInviteComponent implements OnInit {
  readonly isProcessing = signal(true);
  readonly isSuccess = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly organizationName = signal<string | null>(null);
  readonly role = signal<string | null>(null);

  private token: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invitationService: InvitationService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    // Extract token from query parameter
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.errorMessage.set('Invalid invitation link. No token provided.');
      this.isProcessing.set(false);
      return;
    }

    // Check if user is logged in
    const isLoggedIn = this.authService.user() !== null;

    if (!isLoggedIn) {
      // Not logged in - redirect to register with token
      this.router.navigate(['/auth/register'], {
        queryParams: { inviteToken: this.token }
      });
      return;
    }

    // User is logged in - accept invitation
    await this.acceptInvitation();
  }

  private async acceptInvitation(): Promise<void> {
    if (!this.token) return;

    try {
      const response = await this.invitationService.acceptInvitation(this.token);

      this.isSuccess.set(true);
      this.organizationName.set(response.data.organization.name);
      this.role.set(response.data.role);

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 3000);
    } catch (error: any) {
      this.errorMessage.set(this.parseErrorMessage(error.message));
    } finally {
      this.isProcessing.set(false);
    }
  }

  private parseErrorMessage(message: string): string {
    // Provide user-friendly error messages
    if (message.includes('Invalid invitation token')) {
      return 'This invitation link is invalid. It may have been revoked or already used.';
    }
    if (message.includes('already been accepted')) {
      return 'This invitation has already been accepted. You are already a member of this organization.';
    }
    if (message.includes('expired')) {
      return 'This invitation has expired. Please ask the organization admin to send a new invitation.';
    }
    if (message.includes('different email')) {
      return 'This invitation was sent to a different email address. Please log in with the correct account.';
    }
    return message || 'An error occurred while accepting the invitation. Please try again.';
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
