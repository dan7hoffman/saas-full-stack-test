import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();
const dashboardController = new DashboardController();

/**
 * Dashboard Routes
 *
 * All routes require authentication and CSRF protection (handled by requireAuth)
 * Rate limiting handled by global apiRateLimit middleware
 */

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics and metrics
 * @access  Private
 */
router.get(
  '/stats',
  requireAuth,
  dashboardController.getStats.bind(dashboardController)
);

/**
 * @route   GET /api/dashboard/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get(
  '/me',
  requireAuth,
  dashboardController.getMe.bind(dashboardController)
);

export default router;
