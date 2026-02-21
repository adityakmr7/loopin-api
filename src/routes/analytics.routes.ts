import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth.middleware';
import { prisma } from '@/config/database';
import { getAnalyticsOverview } from '@/services/analytics.service';

const analytics = new Hono();

const VALID_PERIODS = ['7d', '30d', '90d'] as const;

const overviewQuerySchema = z.object({
  accountId: z.string().min(1, 'accountId is required'),
  period: z.enum(VALID_PERIODS, { message: 'period must be one of "7d", "30d", "90d"' }),
});

/**
 * GET /api/analytics/overview
 * Returns automation analytics summary, daily chart, top rules, and trigger breakdown
 * for a given Instagram account and time period.
 *
 * Query params:
 *   accountId (string, required) — the Instagram account ID (our internal ID)
 *   period    (string, required) — "7d" | "30d" | "90d"
 *
 * Auth: Bearer token required. User must own the requested account.
 */
analytics.get(
  '/overview',
  authMiddleware,
  zValidator('query', overviewQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: result.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        400
      );
    }
  }),
  async (c) => {
    const { userId } = c.get('user');
    const { accountId, period } = c.req.valid('query');

    // Look up the account to verify existence and ownership
    const account = await prisma.instagramAccount.findUnique({
      where: { id: accountId },
      select: { id: true, userId: true },
    });

    if (!account) {
      return c.json({ success: false, error: 'Account not found' }, 404);
    }

    if (account.userId !== userId) {
      return c.json(
        { success: false, error: 'You do not have access to this account' },
        403
      );
    }

    try {
      const data = await getAnalyticsOverview(accountId, period);
      return c.json({ success: true, data });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch analytics',
        },
        500
      );
    }
  }
);

export default analytics;
