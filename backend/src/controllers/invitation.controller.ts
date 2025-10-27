import { Request, Response, NextFunction } from 'express';
import { PrismaClient, OrganizationRole } from '@prisma/client';
import { z } from 'zod';
import { createHash, randomBytes } from 'crypto';
import { sendInvitationEmail } from '../lib/email';

const prisma = new PrismaClient();

/**
 * Validation schemas
 */
const sendInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).optional().default('MEMBER'),
});

/**
 * Helper: Get user's organization membership
 */
async function getOrganizationMembership(userId: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organization: { deletedAt: null },
    },
    include: {
      organization: true,
    },
  });

  if (!membership) {
    throw new Error('NO_ORGANIZATION');
  }

  return membership;
}

/**
 * Helper: Generate invitation token
 */
function generateInvitationToken(): { token: string; hashedToken: string } {
  const token = randomBytes(32).toString('hex');
  const hashedToken = createHash('sha256').update(token).digest('hex');
  return { token, hashedToken };
}

/**
 * Invitation Controller
 */
export class InvitationController {
  /**
   * Send invitation to email address
   * POST /api/invitations
   */
  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get user's organization
      let membership;
      try {
        membership = await getOrganizationMembership(userId);
      } catch (error) {
        if (error instanceof Error && error.message === 'NO_ORGANIZATION') {
          res.status(403).json({ error: 'No organization membership' });
          return;
        }
        throw error;
      }

      // Check permission: ADMIN or OWNER can invite
      if (membership.role === 'VIEWER' || membership.role === 'MEMBER') {
        res.status(403).json({ error: 'Only admins and owners can send invitations' });
        return;
      }

      // Validate input
      const validated = sendInvitationSchema.parse(req.body);

      // Check if user is trying to invite themselves
      const inviteeUser = await prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (inviteeUser && inviteeUser.id === userId) {
        res.status(400).json({ error: 'Cannot invite yourself' });
        return;
      }

      // Check if user is already a member
      if (inviteeUser) {
        const existingMember = await prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: membership.organizationId,
              userId: inviteeUser.id,
            },
          },
        });

        if (existingMember) {
          res.status(400).json({ error: 'User is already a member of this organization' });
          return;
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await prisma.invitation.findUnique({
        where: {
          organizationId_email: {
            organizationId: membership.organizationId,
            email: validated.email,
          },
        },
      });

      if (existingInvitation && !existingInvitation.acceptedAt && !existingInvitation.revokedAt) {
        // Check if invitation is still valid
        if (existingInvitation.expiresAt > new Date()) {
          res.status(400).json({ error: 'An active invitation already exists for this email' });
          return;
        }
      }

      // Generate invitation token
      const { token, hashedToken } = generateInvitationToken();

      // Set expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create or update invitation
      const invitation = await prisma.invitation.upsert({
        where: {
          organizationId_email: {
            organizationId: membership.organizationId,
            email: validated.email,
          },
        },
        create: {
          organizationId: membership.organizationId,
          email: validated.email,
          role: validated.role as OrganizationRole,
          token: hashedToken,
          invitedBy: userId,
          expiresAt,
        },
        update: {
          role: validated.role as OrganizationRole,
          token: hashedToken,
          invitedBy: userId,
          sentAt: new Date(),
          expiresAt,
          acceptedAt: null,
          revokedAt: null,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Send invitation email
      try {
        await sendInvitationEmail({
          to: validated.email,
          organizationName: membership.organization.name,
          inviterName: `${userId}`, // You might want to fetch actual user name
          token,
          role: validated.role as OrganizationRole,
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the request if email fails, invitation is created
      }

      res.status(201).json({
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          sentAt: invitation.sentAt,
        },
        message: 'Invitation sent successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  }

  /**
   * List invitations for current user's organization
   * GET /api/invitations
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get user's organization
      let membership;
      try {
        membership = await getOrganizationMembership(userId);
      } catch (error) {
        if (error instanceof Error && error.message === 'NO_ORGANIZATION') {
          res.status(403).json({ error: 'No organization membership' });
          return;
        }
        throw error;
      }

      // Get all invitations for organization
      const invitations = await prisma.invitation.findMany({
        where: {
          organizationId: membership.organizationId,
        },
        select: {
          id: true,
          email: true,
          role: true,
          sentAt: true,
          expiresAt: true,
          acceptedAt: true,
          revokedAt: true,
        },
        orderBy: {
          sentAt: 'desc',
        },
      });

      // Categorize invitations
      const pending = invitations.filter(
        (inv) => !inv.acceptedAt && !inv.revokedAt && inv.expiresAt > new Date()
      );
      const expired = invitations.filter(
        (inv) => !inv.acceptedAt && !inv.revokedAt && inv.expiresAt <= new Date()
      );
      const accepted = invitations.filter((inv) => inv.acceptedAt);
      const revoked = invitations.filter((inv) => inv.revokedAt);

      res.status(200).json({
        data: {
          pending,
          expired,
          accepted,
          revoked,
        },
        meta: {
          total: invitations.length,
          pendingCount: pending.length,
          expiredCount: expired.length,
          acceptedCount: accepted.length,
          revokedCount: revoked.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept invitation
   * POST /api/invitations/accept/:token
   */
  async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { token } = req.params;
      if (!token) {
        res.status(400).json({ error: 'Invitation token is required' });
        return;
      }

      // Hash the provided token
      const hashedToken = createHash('sha256').update(token).digest('hex');

      // Find invitation
      const invitation = await prisma.invitation.findUnique({
        where: { token: hashedToken },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              deletedAt: true,
            },
          },
        },
      });

      if (!invitation) {
        res.status(404).json({ error: 'Invalid invitation token' });
        return;
      }

      // Check if invitation is still valid
      if (invitation.acceptedAt) {
        res.status(400).json({ error: 'Invitation has already been accepted' });
        return;
      }

      if (invitation.revokedAt) {
        res.status(400).json({ error: 'Invitation has been revoked' });
        return;
      }

      if (invitation.expiresAt < new Date()) {
        res.status(400).json({ error: 'Invitation has expired' });
        return;
      }

      if (invitation.organization.deletedAt) {
        res.status(400).json({ error: 'Organization no longer exists' });
        return;
      }

      // Get user's email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify email matches invitation
      if (user.email !== invitation.email) {
        res.status(403).json({
          error: 'This invitation was sent to a different email address',
          invitedEmail: invitation.email,
          yourEmail: user.email,
        });
        return;
      }

      // Check if user is already a member
      const existingMember = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId,
          },
        },
      });

      if (existingMember) {
        // Mark invitation as accepted anyway
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        });

        res.status(200).json({
          message: 'You are already a member of this organization',
          data: {
            organization: invitation.organization,
            role: existingMember.role,
          },
        });
        return;
      }

      // Create organization membership and mark invitation as accepted (atomic)
      const [member] = await prisma.$transaction([
        prisma.organizationMember.create({
          data: {
            organizationId: invitation.organizationId,
            userId,
            role: invitation.role,
            invitedBy: invitation.invitedBy,
            invitedAt: invitation.sentAt,
            acceptedAt: new Date(),
          },
        }),
        prisma.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        }),
      ]);

      res.status(200).json({
        message: `Successfully joined ${invitation.organization.name}`,
        data: {
          organization: invitation.organization,
          role: member.role,
          acceptedAt: member.acceptedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke invitation
   * DELETE /api/invitations/:id
   */
  async revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get user's organization
      let membership;
      try {
        membership = await getOrganizationMembership(userId);
      } catch (error) {
        if (error instanceof Error && error.message === 'NO_ORGANIZATION') {
          res.status(403).json({ error: 'No organization membership' });
          return;
        }
        throw error;
      }

      // Check permission: ADMIN or OWNER can revoke
      if (membership.role === 'VIEWER' || membership.role === 'MEMBER') {
        res.status(403).json({ error: 'Only admins and owners can revoke invitations' });
        return;
      }

      const { id } = req.params;

      // Find invitation
      const invitation = await prisma.invitation.findUnique({
        where: { id },
      });

      if (!invitation) {
        res.status(404).json({ error: 'Invitation not found' });
        return;
      }

      // Verify invitation belongs to user's organization
      if (invitation.organizationId !== membership.organizationId) {
        res.status(403).json({ error: 'Invitation belongs to different organization' });
        return;
      }

      // Check if invitation can be revoked
      if (invitation.acceptedAt) {
        res.status(400).json({ error: 'Cannot revoke an accepted invitation' });
        return;
      }

      if (invitation.revokedAt) {
        res.status(400).json({ error: 'Invitation is already revoked' });
        return;
      }

      // Revoke invitation
      await prisma.invitation.update({
        where: { id },
        data: { revokedAt: new Date() },
      });

      res.status(200).json({
        message: 'Invitation revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
