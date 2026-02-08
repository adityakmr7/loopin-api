import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth.middleware';
import { getDashboardStats, getOverviewStats } from '@/services/dashboard.service';
import type { ApiResponse } from '@/types';

const dashboard = new Hono();

const accountIdSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
});

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for a specific Instagram account
 */
dashboard.get(
  '/stats',
  authMiddleware,
  zValidator('query', accountIdSchema),
  async (c) => {
    const { accountId } = c.req.valid('query');

    try {
      const stats = await getDashboardStats(accountId);

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      return c.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
      };
      return c.json(response, 500);
    }
  }
);

/**
 * GET /api/dashboard/overview
 * Get overview statistics for all connected accounts
 */
dashboard.get('/overview', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const userId = user?.userId;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: 'User ID not found',
      };
      return c.json(response, 401);
    }

    const stats = await getOverviewStats(userId);

    const response: ApiResponse = {
      success: true,
      data: stats,
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch overview stats',
    };
    return c.json(response, 500);
  }
});

export default dashboard;
