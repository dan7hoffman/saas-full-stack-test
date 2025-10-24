import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';
import { z } from 'zod';

// Validation schemas
const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT', 'RETIREMENT', 'PROPERTY', 'VEHICLE', 'CRYPTO', 'OTHER']),
  currency: z.string().default('USD'),
  institution: z.string().optional(),
  accountNumber: z.string().optional(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT', 'RETIREMENT', 'PROPERTY', 'VEHICLE', 'CRYPTO', 'OTHER']).optional(),
  institution: z.string().optional(),
  accountNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

export class AccountController {
  // GET /api/accounts - List all accounts for current user
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const includeInactive = req.query.includeInactive === 'true';

      const accounts = await prisma.account.findMany({
        where: {
          userId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        include: {
          balances: {
            orderBy: { date: 'desc' },
            take: 1, // Get latest balance
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.status(200).json({
        data: accounts,
        meta: {
          count: accounts.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/accounts/:id - Get single account
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const account = await prisma.account.findFirst({
        where: { id, userId },
        include: {
          balances: {
            orderBy: { date: 'desc' },
          },
        },
      });

      if (!account) {
        res.status(404).json({ error: 'Account not found' });
        return;
      }

      res.status(200).json({ data: account });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/accounts - Create new account
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validated = createAccountSchema.parse(req.body);

      const account = await prisma.account.create({
        data: {
          ...validated,
          userId,
        },
      });

      res.status(201).json({ data: account });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  }

  // PATCH /api/accounts/:id - Update account
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const validated = updateAccountSchema.parse(req.body);

      // Verify ownership
      const existing = await prisma.account.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Account not found' });
        return;
      }

      const account = await prisma.account.update({
        where: { id },
        data: validated,
      });

      res.status(200).json({ data: account });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  }

  // DELETE /api/accounts/:id - Delete account (soft delete by default)
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const hardDelete = req.query.hard === 'true';

      // Verify ownership
      const existing = await prisma.account.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Account not found' });
        return;
      }

      if (hardDelete) {
        await prisma.account.delete({ where: { id } });
      } else {
        await prisma.account.update({
          where: { id },
          data: { isActive: false },
        });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
