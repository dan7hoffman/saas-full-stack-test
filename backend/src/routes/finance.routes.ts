import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';
import { LiabilityController } from '../controllers/liability.controller';
import { BalanceController } from '../controllers/balance.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Initialize controllers
const accountController = new AccountController();
const liabilityController = new LiabilityController();
const balanceController = new BalanceController();

// All routes require authentication
router.use(requireAuth);

// Account routes
router.get('/accounts', accountController.list.bind(accountController));
router.get('/accounts/:id', accountController.get.bind(accountController));
router.post('/accounts', accountController.create.bind(accountController));
router.patch('/accounts/:id', accountController.update.bind(accountController));
router.delete('/accounts/:id', accountController.delete.bind(accountController));

// Liability routes
router.get('/liabilities', liabilityController.list.bind(liabilityController));
router.get('/liabilities/:id', liabilityController.get.bind(liabilityController));
router.post('/liabilities', liabilityController.create.bind(liabilityController));
router.patch('/liabilities/:id', liabilityController.update.bind(liabilityController));
router.delete('/liabilities/:id', liabilityController.delete.bind(liabilityController));

// Balance routes
router.get('/balances', balanceController.list.bind(balanceController));
router.post('/balances', balanceController.create.bind(balanceController));
router.post('/balances/bulk', balanceController.bulkUpdate.bind(balanceController));
router.delete('/balances/:id', balanceController.delete.bind(balanceController));

// Net worth calculation
router.get('/net-worth', balanceController.getNetWorth.bind(balanceController));

export default router;
