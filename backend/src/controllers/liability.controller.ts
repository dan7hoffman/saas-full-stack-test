import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';
import { z } from 'zod';

// Validation schemas
const createLiabilitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['CREDIT_CARD', 'STUDENT_LOAN', 'MORTGAGE', 'AUTO_LOAN', 'PERSONAL_LOAN', 'OTHER']),
  currency: z.string().default('USD'),
  interestRate: z.number().min(0).max(100).optional(),
  minimumPayment: z.number().min(0).optional(),
  dueDate: z.number().min(1).max(31).optional(),
  institution: z.string().optional(),
  accountNumber: z.string().optional(),
});

const updateLiabilitySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['CREDIT_CARD', 'STUDENT_LOAN', 'MORTGAGE', 'AUTO_LOAN', 'PERSONAL_LOAN', 'OTHER']).optional(),
  interestRate: z.number().min(0).max(100).optional(),
  minimumPayment: z.number().min(0).optional(),
  dueDate: z.number().min(1).max(31).optional(),
  institution: z.string().optional(),
  accountNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

export class LiabilityController {
  // GET /api/liabilities - List all liabilities for current user
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const includeInactive = req.query.includeInactive === 'true';

      const liabilities = await prisma.liability.findMany({
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
        data: liabilities,
        meta: {
          count: liabilities.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/liabilities/:id - Get single liability
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const liability = await prisma.liability.findFirst({
        where: { id, userId },
        include: {
          balances: {
            orderBy: { date: 'desc' },
          },
        },
      });

      if (!liability) {
        res.status(404).json({ error: 'Liability not found' });
        return;
      }

      res.status(200).json({ data: liability });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/liabilities - Create new liability
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validated = createLiabilitySchema.parse(req.body);

      const liability = await prisma.liability.create({
        data: {
          ...validated,
          userId,
        },
      });

      res.status(201).json({ data: liability });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  }

  // PATCH /api/liabilities/:id - Update liability
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const validated = updateLiabilitySchema.parse(req.body);

      // Verify ownership
      const existing = await prisma.liability.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Liability not found' });
        return;
      }

      const liability = await prisma.liability.update({
        where: { id },
        data: validated,
      });

      res.status(200).json({ data: liability });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  }

  // DELETE /api/liabilities/:id - Delete liability (soft delete by default)
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
      const existing = await prisma.liability.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Liability not found' });
        return;
      }

      if (hardDelete) {
        await prisma.liability.delete({ where: { id } });
      } else {
        await prisma.liability.update({
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
