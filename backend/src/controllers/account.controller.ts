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

export class AccountController {
  // GET /api/accounts - List all accounts for current user's organization
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
      const accounts = await prisma.account.findMany({
        where: {
          organizationId: membership.organizationId,
          deletedAt: null, // Exclude soft-deleted accounts
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

      // Query by organizationId AND account ID
      const account = await prisma.account.findFirst({
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
        res.status(403).json({ error: 'Viewers cannot create accounts' });
        return;
      }

      const validated = createAccountSchema.parse(req.body);

      // Create with organizationId and createdBy (from auth, not body!)
      const account = await prisma.account.create({
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
        res.status(403).json({ error: 'Viewers cannot edit accounts' });
        return;
      }

      const { id } = req.params;
      const validated = updateAccountSchema.parse(req.body);

      // Verify account belongs to user's organization
      const existing = await prisma.account.findFirst({
        where: {
          id,
          organizationId: membership.organizationId,
          deletedAt: null,
        },
      });

      if (!existing) {
        res.status(404).json({ error: 'Account not found' });
        return;
      }

      const account = await prisma.account.update({
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
        res.status(403).json({ error: 'Only admins can delete accounts' });
        return;
      }

      const { id } = req.params;
      const hardDelete = req.query.hard === 'true';

      // Verify account belongs to user's organization
      const existing = await prisma.account.findFirst({
        where: {
          id,
          organizationId: membership.organizationId,
          deletedAt: null,
        },
      });

      if (!existing) {
        res.status(404).json({ error: 'Account not found' });
        return;
      }

      if (hardDelete) {
        // Hard delete (only if explicitly requested)
        await prisma.account.delete({ where: { id } });
      } else {
        // Soft delete with audit trail
        await prisma.account.update({
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
