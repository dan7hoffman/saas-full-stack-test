import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';

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
 * Dashboard Controller
 *
 * Provides aggregated statistics and metrics for the dashboard view.
 * All endpoints require authentication.
 * Stats are now organization-scoped for multi-tenancy.
 */
export class DashboardController {
  /**
   * Get dashboard statistics
   *
   * Returns aggregated metrics (organization-scoped):
   * - Total users count (system-wide for now, could be org-specific)
   * - Active sessions count (system-wide)
   * - User's own session count
   * - Account age in days
   * - Organization member count
   * - Organization accounts/liabilities count
   *
   * @route GET /api/dashboard/stats
   * @access Private (requires authentication)
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Get user to calculate account age
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Run aggregations in parallel for performance
      const [
        totalUsers,
        activeSessions,
        userSessions,
        orgMemberCount,
        orgAccountCount,
        orgLiabilityCount,
      ] = await Promise.all([
        // Total registered users (system-wide)
        prisma.user.count({ where: { deletedAt: null } }),

        // Active sessions (not expired) - system-wide
        prisma.session.count({
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
        }),

        // Current user's sessions
        prisma.session.count({
          where: {
            userId,
            expiresAt: {
              gt: new Date(),
            },
          },
        }),

        // Organization member count
        prisma.organizationMember.count({
          where: {
            organizationId: membership.organizationId,
          },
        }),

        // Organization accounts count (active, not deleted)
        prisma.account.count({
          where: {
            organizationId: membership.organizationId,
            deletedAt: null,
            isActive: true,
          },
        }),

        // Organization liabilities count (active, not deleted)
        prisma.liability.count({
          where: {
            organizationId: membership.organizationId,
            deletedAt: null,
            isActive: true,
          },
        }),
      ]);

      // Calculate account age in days
      const accountAgeMs = Date.now() - user.createdAt.getTime();
      const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

      // Calculate days since last login
      const daysSinceLastLogin = user.lastLoginAt
        ? Math.floor((Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      res.status(200).json({
        data: {
          // User stats
          totalUsers,
          activeSessions,
          userSessions,
          accountAgeDays,
          daysSinceLastLogin,
          // Organization stats
          organizationMemberCount: orgMemberCount,
          organizationAccountCount: orgAccountCount,
          organizationLiabilityCount: orgLiabilityCount,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's profile
   *
   * Returns the authenticated user's profile information
   * including organization membership details.
   *
   * @route GET /api/dashboard/me
   * @access Private (requires authentication)
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get user with organization membership
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          organizationMemberships: {
            where: {
              organization: { deletedAt: null },
            },
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  plan: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        data: {
          ...user,
          // Simplify to single organization (users currently belong to one org)
          organization: user.organizationMemberships[0]?.organization || null,
          organizationRole: user.organizationMemberships[0]?.role || null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
