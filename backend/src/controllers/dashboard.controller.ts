import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';

/**
 * Dashboard Controller
 *
 * Provides aggregated statistics and metrics for the dashboard view.
 * All endpoints require authentication.
 */
export class DashboardController {
  /**
   * Get dashboard statistics
   *
   * Returns aggregated metrics:
   * - Total users count
   * - Active sessions count
   * - User's own session count
   * - Account age in days
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
      const [totalUsers, activeSessions, userSessions] = await Promise.all([
        // Total registered users
        prisma.user.count(),

        // Active sessions (not expired)
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
          totalUsers,
          activeSessions,
          userSessions,
          accountAgeDays,
          daysSinceLastLogin,
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
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        data: user,
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
