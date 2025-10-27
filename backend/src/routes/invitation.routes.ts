import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.controller';
import { authenticateRequest } from '../middleware/auth';

const router = Router();
const invitationController = new InvitationController();

/**
 * All invitation routes require authentication
 */
router.use(authenticateRequest);

/**
 * @route   POST /api/invitations
 * @desc    Send invitation to email address
 * @access  Private (ADMIN, OWNER only)
 */
router.post('/', invitationController.send.bind(invitationController));

/**
 * @route   GET /api/invitations
 * @desc    List invitations for current user's organization
 * @access  Private
 */
router.get('/', invitationController.list.bind(invitationController));

/**
 * @route   POST /api/invitations/accept/:token
 * @desc    Accept invitation
 * @access  Private
 */
router.post('/accept/:token', invitationController.accept.bind(invitationController));

/**
 * @route   DELETE /api/invitations/:id
 * @desc    Revoke invitation
 * @access  Private (ADMIN, OWNER only)
 */
router.delete('/:id', invitationController.revoke.bind(invitationController));

export default router;
