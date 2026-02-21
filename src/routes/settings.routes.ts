import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth.middleware';
import { getOrCreateSettings, updateSettings } from '@/services/settings.service';
import type { ApiResponse } from '@/types';

const settings = new Hono();

const updateSettingsSchema = z.object({
  timezone: z.string().optional(),
  maxRepliesPerHour: z.number().int().min(1).max(500).optional(),
  replyDelayMinSecs: z.number().int().min(0).max(300).optional(),
  replyDelayMaxSecs: z.number().int().min(0).max(300).optional(),
  blockedKeywords: z.array(z.string()).optional(),
  ignoredUsernames: z.array(z.string()).optional(),
  notifyOnTokenExpiry: z.boolean().optional(),
  notifyOnRuleFailure: z.boolean().optional(),
});

/**
 * GET /api/settings
 * Get user settings (auto-creates defaults on first call)
 */
settings.get('/', authMiddleware, async (c) => {
  const { userId } = c.get('user');

  try {
    const data = await getOrCreateSettings(userId);
    const response: ApiResponse = { success: true, data };
    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch settings',
    };
    return c.json(response, 500);
  }
});

/**
 * PATCH /api/settings
 * Partially update user settings
 */
settings.patch('/', authMiddleware, zValidator('json', updateSettingsSchema), async (c) => {
  const { userId } = c.get('user');
  const data = c.req.valid('json');

  try {
    // Validate delay range: min must not exceed max
    if (
      data.replyDelayMinSecs !== undefined &&
      data.replyDelayMaxSecs !== undefined &&
      data.replyDelayMinSecs > data.replyDelayMaxSecs
    ) {
      return c.json(
        { success: false, error: 'replyDelayMinSecs must be less than or equal to replyDelayMaxSecs' },
        400
      );
    }

    const updated = await updateSettings(userId, data);
    const response: ApiResponse = { success: true, data: updated };
    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    };
    return c.json(response, 500);
  }
});

export default settings;
