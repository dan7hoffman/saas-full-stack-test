/**
 * Organization role enum
 */
export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

/**
 * Invitation status enum
 */
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

/**
 * Invitation interface
 */
export interface Invitation {
  id: string;
  email: string;
  role: OrganizationRole;
  sentAt: string;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  status?: InvitationStatus; // Computed on frontend based on dates
  organizationName?: string; // For display purposes
}

/**
 * Send invitation request
 */
export interface SendInvitationRequest {
  email: string;
  role?: OrganizationRole;
}

/**
 * Send invitation response
 */
export interface SendInvitationResponse {
  data: {
    id: string;
    email: string;
    role: OrganizationRole;
    expiresAt: string;
    sentAt: string;
  };
  message: string;
}

/**
 * List invitations response
 */
export interface ListInvitationsResponse {
  data: {
    pending: Invitation[];
    expired: Invitation[];
    accepted: Invitation[];
    revoked: Invitation[];
  };
  meta: {
    total: number;
    pendingCount: number;
    expiredCount: number;
    acceptedCount: number;
    revokedCount: number;
  };
}

/**
 * Accept invitation response
 */
export interface AcceptInvitationResponse {
  message: string;
  data: {
    organization: {
      id: string;
      name: string;
    };
    role: OrganizationRole;
    acceptedAt?: string;
  };
}
