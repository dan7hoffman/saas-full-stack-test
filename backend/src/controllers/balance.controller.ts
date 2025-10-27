import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

// Validation schemas
const createBalanceSchema = z.object({
  accountId: z.string().optional(),
  liabilityId: z.string().optional(),
  amount: z.number(),
  date: z.string().datetime(),
  note: z.string().optional(),
}).refine(data => (data.accountId || data.liabilityId) && !(data.accountId && data.liabilityId), {
  message: 'Must provide either accountId or liabilityId, but not both',
});

const bulkUpdateBalancesSchema = z.object({
  date: z.string().datetime(),
  balances: z.array(z.object({
    accountId: z.string().optional(),
    liabilityId: z.string().optional(),
    amount: z.number(),
  })).refine(items => items.every(item => (item.accountId || item.liabilityId) && !(item.accountId && item.liabilityId)), {
    message: 'Each balance must have either accountId or liabilityId, but not both',
  }),
  note: z.string().optional(),
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

export class BalanceController {
  // GET /api/balances - Get balances for a specific date (or latest if no date)
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

      const dateParam = req.query.date as string | undefined;

      if (dateParam) {
        // Get balances for specific date
        const date = new Date(dateParam);

        const [accountBalances, liabilityBalances] = await Promise.all([
          prisma.balance.findMany({
            where: {
              account: {
                organizationId: membership.organizationId,
                deletedAt: null,
              },
              date,
            },
            include: {
              account: true,
            },
          }),
          prisma.balance.findMany({
            where: {
              liability: {
                organizationId: membership.organizationId,
                deletedAt: null,
              },
              date,
            },
            include: {
              liability: true,
            },
          }),
        ]);

        res.status(200).json({
          data: {
            accounts: accountBalances,
            liabilities: liabilityBalances,
            date: date.toISOString(),
          },
        });
      } else {
        // Get all unique dates with balances for this organization
        const dates = await prisma.balance.findMany({
          where: {
            OR: [
              {
                account: {
                  organizationId: membership.organizationId,
                  deletedAt: null,
                },
              },
              {
                liability: {
                  organizationId: membership.organizationId,
                  deletedAt: null,
                },
              },
            ],
          },
          select: {
            date: true,
          },
          distinct: ['date'],
          orderBy: {
            date: 'desc',
          },
        });

        res.status(200).json({
          data: dates.map(d => d.date),
          meta: {
            count: dates.length,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // POST /api/balances - Create a single balance entry
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

      // Check permission: MEMBER or higher can create balances
      if (membership.role === 'VIEWER') {
        res.status(403).json({ error: 'Viewers cannot create balances' });
        return;
      }

      const validated = createBalanceSchema.parse(req.body);

      // Verify ownership of account/liability belongs to user's organization
      if (validated.accountId) {
        const account = await prisma.account.findFirst({
          where: {
            id: validated.accountId,
            organizationId: membership.organizationId,
            deletedAt: null,
          },
        });
        if (!account) {
          res.status(404).json({ error: 'Account not found' });
          return;
        }
      }

      if (validated.liabilityId) {
        const liability = await prisma.liability.findFirst({
          where: {
            id: validated.liabilityId,
            organizationId: membership.organizationId,
            deletedAt: null,
          },
        });
        if (!liability) {
          res.status(404).json({ error: 'Liability not found' });
          return;
        }
      }

      const balance = await prisma.balance.create({
        data: {
          accountId: validated.accountId,
          liabilityId: validated.liabilityId,
          amount: new Decimal(validated.amount),
          date: new Date(validated.date),
          note: validated.note,
        },
        include: {
          account: true,
          liability: true,
        },
      });

      res.status(201).json({ data: balance });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  }

  // POST /api/balances/bulk - Bulk update all balances for a specific date
  async bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Check permission: MEMBER or higher can update balances
      if (membership.role === 'VIEWER') {
        res.status(403).json({ error: 'Viewers cannot update balances' });
        return;
      }

      const validated = bulkUpdateBalancesSchema.parse(req.body);
      const date = new Date(validated.date);

      // Verify ownership of all accounts/liabilities belong to user's organization
      const accountIds = validated.balances.filter(b => b.accountId).map(b => b.accountId!);
      const liabilityIds = validated.balances.filter(b => b.liabilityId).map(b => b.liabilityId!);

      const [accounts, liabilities] = await Promise.all([
        prisma.account.findMany({
          where: {
            id: { in: accountIds },
            organizationId: membership.organizationId,
            deletedAt: null,
          },
          select: { id: true },
        }),
        prisma.liability.findMany({
          where: {
            id: { in: liabilityIds },
            organizationId: membership.organizationId,
            deletedAt: null,
          },
          select: { id: true },
        }),
      ]);

      if (accounts.length !== accountIds.length || liabilities.length !== liabilityIds.length) {
        res.status(404).json({ error: 'One or more accounts/liabilities not found' });
        return;
      }

      // Upsert all balances
      const results = await Promise.all(
        validated.balances.map(balance =>
          prisma.balance.upsert({
            where: balance.accountId
              ? { accountId_date: { accountId: balance.accountId, date } }
              : { liabilityId_date: { liabilityId: balance.liabilityId!, date } },
            update: {
              amount: new Decimal(balance.amount),
              note: validated.note,
            },
            create: {
              accountId: balance.accountId,
              liabilityId: balance.liabilityId,
              amount: new Decimal(balance.amount),
              date,
              note: validated.note,
            },
          })
        )
      );

      res.status(200).json({
        data: results,
        meta: {
          count: results.length,
          date: date.toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  }

  // GET /api/balances/net-worth - Calculate net worth for a specific date or all dates
  async getNetWorth(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const dateParam = req.query.date as string | undefined;

      if (dateParam) {
        // Calculate net worth for specific date (organization-scoped)
        const date = new Date(dateParam);

        const [accountBalances, liabilityBalances] = await Promise.all([
          prisma.balance.findMany({
            where: {
              account: {
                organizationId: membership.organizationId,
                deletedAt: null,
              },
              date,
            },
          }),
          prisma.balance.findMany({
            where: {
              liability: {
                organizationId: membership.organizationId,
                deletedAt: null,
              },
              date,
            },
          }),
        ]);

        const totalAssets = accountBalances.reduce((sum, b) => sum + Number(b.amount), 0);
        const totalLiabilities = liabilityBalances.reduce((sum, b) => sum + Number(b.amount), 0);
        const netWorth = totalAssets - totalLiabilities;

        res.status(200).json({
          data: {
            date: date.toISOString(),
            totalAssets,
            totalLiabilities,
            netWorth,
            accountCount: accountBalances.length,
            liabilityCount: liabilityBalances.length,
          },
        });
      } else {
        // Calculate net worth for all dates (organization-scoped)
        const dates = await prisma.balance.findMany({
          where: {
            OR: [
              {
                account: {
                  organizationId: membership.organizationId,
                  deletedAt: null,
                },
              },
              {
                liability: {
                  organizationId: membership.organizationId,
                  deletedAt: null,
                },
              },
            ],
          },
          select: { date: true },
          distinct: ['date'],
          orderBy: { date: 'asc' },
        });

        const netWorthHistory = await Promise.all(
          dates.map(async ({ date }) => {
            const [accountBalances, liabilityBalances] = await Promise.all([
              prisma.balance.findMany({
                where: {
                  account: {
                    organizationId: membership.organizationId,
                    deletedAt: null,
                  },
                  date,
                },
              }),
              prisma.balance.findMany({
                where: {
                  liability: {
                    organizationId: membership.organizationId,
                    deletedAt: null,
                  },
                  date,
                },
              }),
            ]);

            const totalAssets = accountBalances.reduce((sum, b) => sum + Number(b.amount), 0);
            const totalLiabilities = liabilityBalances.reduce((sum, b) => sum + Number(b.amount), 0);

            return {
              date: date.toISOString(),
              totalAssets,
              totalLiabilities,
              netWorth: totalAssets - totalLiabilities,
            };
          })
        );

        res.status(200).json({
          data: netWorthHistory,
          meta: {
            count: netWorthHistory.length,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/balances/:id - Delete a balance entry
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

      // Check permission: MEMBER or higher can delete balances
      if (membership.role === 'VIEWER') {
        res.status(403).json({ error: 'Viewers cannot delete balances' });
        return;
      }

      const { id } = req.params;

      // Verify ownership through account or liability (organization-scoped)
      const balance = await prisma.balance.findFirst({
        where: {
          id,
          OR: [
            {
              account: {
                organizationId: membership.organizationId,
                deletedAt: null,
              },
            },
            {
              liability: {
                organizationId: membership.organizationId,
                deletedAt: null,
              },
            },
          ],
        },
      });

      if (!balance) {
        res.status(404).json({ error: 'Balance not found' });
        return;
      }

      await prisma.balance.delete({ where: { id } });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
