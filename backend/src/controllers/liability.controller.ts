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

/**
 * Helper: Get user's organization membership
 * Throws 403 if user doesn't belong to any organization
 */
async function getOrganizationMembership(userId: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organization: { deletedAt: null }, // Org must be active
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

export class LiabilityController {
  // GET /api/liabilities - List all liabilities for current user's organization
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

      const includeInactive = req.query.includeInactive === 'true';

      // Query by organizationId instead of userId
      const liabilities = await prisma.liability.findMany({
        where: {
          organizationId: membership.organizationId,
          deletedAt: null, // Exclude soft-deleted
          ...(includeInactive ? {} : { isActive: true }),
        },
        include: {
          balances: {
            orderBy: { date: 'desc' },
            take: 1, // Get latest balance
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
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

      const { id } = req.params;

      // Query by organizationId AND liability ID
      const liability = await prisma.liability.findFirst({
        where: {
          id,
          organizationId: membership.organizationId,
          deletedAt: null,
        },
        include: {
          balances: {
            orderBy: { date: 'desc' },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
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

      // Check permission: MEMBER or higher can create
      if (membership.role === 'VIEWER') {
        res.status(403).json({ error: 'Viewers cannot create liabilities' });
        return;
      }

      const validated = createLiabilitySchema.parse(req.body);

      // Create with organizationId and createdBy (from auth, not body!)
      const liability = await prisma.liability.create({
        data: {
          ...validated,
          organizationId: membership.organizationId,
          createdBy: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
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

      // Check permission: MEMBER or higher can edit
      if (membership.role === 'VIEWER') {
        res.status(403).json({ error: 'Viewers cannot edit liabilities' });
        return;
      }

      const { id } = req.params;
      const validated = updateLiabilitySchema.parse(req.body);

      // Verify liability belongs to user's organization
      const existing = await prisma.liability.findFirst({
        where: {
          id,
          organizationId: membership.organizationId,
          deletedAt: null,
        },
      });

      if (!existing) {
        res.status(404).json({ error: 'Liability not found' });
        return;
      }

      const liability = await prisma.liability.update({
        where: { id },
        data: validated,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
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

      // Check permission: ADMIN or higher can delete
      if (membership.role === 'VIEWER' || membership.role === 'MEMBER') {
        res.status(403).json({ error: 'Only admins can delete liabilities' });
        return;
      }

      const { id } = req.params;
      const hardDelete = req.query.hard === 'true';

      // Verify liability belongs to user's organization
      const existing = await prisma.liability.findFirst({
        where: {
          id,
          organizationId: membership.organizationId,
          deletedAt: null,
        },
      });

      if (!existing) {
        res.status(404).json({ error: 'Liability not found' });
        return;
      }

      if (hardDelete) {
        // Hard delete (only if explicitly requested)
        await prisma.liability.delete({ where: { id } });
      } else {
        // Soft delete with audit trail
        await prisma.liability.update({
          where: { id },
          data: {
            isActive: false,
            deletedAt: new Date(),
            deletedBy: userId,
          },
        });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
