import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '@/middleware/auth.middleware';
import { z } from 'zod';
import { prisma } from '@/config/database';

const automation = new Hono();

// Validation schemas
const createRuleSchema = z.object({
  accountId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  trigger: z.enum(['comment', 'mention', 'message']),
  conditions: z.any(),
  actions: z.any(),
});

// Update schema - all fields optional
const updateRuleSchema = createRuleSchema.partial();

/**
 * POST /api/automation/rules
 * Create automation rule
 */
automation.post('/rules', authMiddleware, zValidator('json', createRuleSchema), async (c) => {
  const { userId } = c.get('user');
  const data = c.req.valid('json');

  // Verify account belongs to user
  const account = await prisma.instagramAccount.findFirst({
    where: { id: data.accountId, userId },
  });

  if (!account) {
    return c.json({ success: false, error: 'Account not found or access denied' }, 404);
  }

  const rule = await prisma.automationRule.create({
    data: {
      ...data,
      userId,
    },
  });

  return c.json({ success: true, data: rule });
});

/**
 * GET /api/automation/rules
 * List automation rules
 */
automation.get('/rules', authMiddleware, async (c) => {
  const { userId } = c.get('user');
  const accountId = c.req.query('accountId');

  const where: any = { userId };
  if (accountId) {
    where.accountId = accountId;
  }

  const rules = await prisma.automationRule.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      account: {
        select: {
          username: true,
        },
      },
    },
  });

  return c.json({ success: true, data: rules });
});

/**
 * GET /api/automation/rules/:id
 * Get automation rule
 */
automation.get('/rules/:id', authMiddleware, async (c) => {
  const { userId } = c.get('user');
  const { id } = c.req.param();

  const rule = await prisma.automationRule.findFirst({
    where: { id, userId },
    include: {
      account: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!rule) {
    return c.json({ success: false, error: 'Rule not found' }, 404);
  }

  return c.json({ success: true, data: rule });
});

/**
 * PATCH /api/automation/rules/:id
 * Update automation rule
 */
automation.patch('/rules/:id', authMiddleware, zValidator('json', updateRuleSchema), async (c) => {
  const { userId } = c.get('user');
  const { id } = c.req.param();
  const data = c.req.valid('json');

  // Check if rule exists and belongs to user
  const existingRule = await prisma.automationRule.findFirst({
    where: { id, userId },
  });

  if (!existingRule) {
    return c.json({ success: false, error: 'Rule not found' }, 404);
  }

  const rule = await prisma.automationRule.update({
    where: { id },
    data,
  });

  return c.json({ success: true, data: rule });
});

/**
 * DELETE /api/automation/rules/:id
 * Delete automation rule
 */
automation.delete('/rules/:id', authMiddleware, async (c) => {
  const { userId } = c.get('user');
  const { id } = c.req.param();

  // Check presence
  const existingRule = await prisma.automationRule.findFirst({
    where: { id, userId },
  });

  if (!existingRule) {
    return c.json({ success: false, error: 'Rule not found' }, 404);
  }

  await prisma.automationRule.delete({
    where: { id },
  });

  return c.json({ success: true });
});

export default automation;
