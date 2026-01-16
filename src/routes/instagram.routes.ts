import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '@/middleware/auth.middleware';
import {
  connectInstagramAccount,
  getUserInstagramAccounts,
  getAccountDetails,
  refreshAccountData,
  disconnectInstagramAccount,
} from '@/services/instagram.service';
import { getAuthorizationUrl, generateStateToken } from '@/lib/instagram-oauth';
import { oauthCallbackSchema, accountIdSchema } from '@/validators/instagram.validator';
import type { ApiResponse } from '@/types';

const instagram = new Hono();

// In-memory state store (in production, use Redis or database)
// Maps state token -> { userId, expiresAt }
const stateStore = new Map<string, { userId: string; expiresAt: number }>();

// Cleanup expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (data.expiresAt < now) {
      stateStore.delete(state);
    }
  }
}, 5 * 60 * 1000);

/**
 * GET /api/instagram/auth
 * Initiate Instagram OAuth flow (protected)
 */
instagram.get('/auth', authMiddleware, async (c) => {
  const { userId } = c.get('user');

  try {
    const state = generateStateToken();
    const authUrl = getAuthorizationUrl(state);

    // Store state with userId (expires in 10 minutes)
    stateStore.set(state, {
      userId,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        authorizationUrl: authUrl,
        state,
      },
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate authorization URL',
    };
    return c.json(response, 500);
  }
});

/**
 * GET /api/instagram/callback
 * Handle OAuth callback from Instagram
 */
instagram.get('/callback', zValidator('query', oauthCallbackSchema), async (c) => {
  const { code, state } = c.req.valid('query');

  try {
    // Validate state token
    const stateData = stateStore.get(state);
    if (!stateData) {
      throw new Error('Invalid or expired OAuth state');
    }

    if (stateData.expiresAt < Date.now()) {
      stateStore.delete(state);
      throw new Error('OAuth state expired');
    }

    const userId = stateData.userId;
    stateStore.delete(state); // One-time use

    // Connect Instagram account
    const account = await connectInstagramAccount(userId, code);

    const response: ApiResponse = {
      success: true,
      message: 'Instagram account connected successfully',
      data: account,
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect Instagram account',
    };
    return c.json(response, 400);
  }
});

/**
 * GET /api/instagram/accounts
 * Get all connected Instagram accounts (protected)
 */
instagram.get('/accounts', authMiddleware, async (c) => {
  const { userId } = c.get('user');

  try {
    const accounts = await getUserInstagramAccounts(userId);

    const response: ApiResponse = {
      success: true,
      data: accounts,
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Instagram accounts',
    };
    return c.json(response, 500);
  }
});

/**
 * GET /api/instagram/accounts/:id
 * Get specific Instagram account details (protected)
 */
instagram.get('/accounts/:id', authMiddleware, zValidator('param', accountIdSchema), async (c) => {
  const { userId } = c.get('user');
  const { id } = c.req.valid('param');

  try {
    const account = await getAccountDetails(id);

    const response: ApiResponse = {
      success: true,
      data: account,
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch account details',
    };
    return c.json(response, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * POST /api/instagram/accounts/:id/refresh
 * Refresh Instagram account data (protected)
 */
instagram.post('/accounts/:id/refresh', authMiddleware, zValidator('param', accountIdSchema), async (c) => {
  const { userId } = c.get('user');
  const { id } = c.req.valid('param');

  try {
    const account = await refreshAccountData(id);

    const response: ApiResponse = {
      success: true,
      message: 'Account data refreshed successfully',
      data: account,
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh account data',
    };
    return c.json(response, 500);
  }
});

/**
 * POST /api/instagram/accounts/:id/disconnect
 * Disconnect Instagram account (protected)
 */
instagram.post('/accounts/:id/disconnect', authMiddleware, zValidator('param', accountIdSchema), async (c) => {
  const { userId } = c.get('user');
  const { id } = c.req.valid('param');

  try {
    await disconnectInstagramAccount(id);

    const response: ApiResponse = {
      success: true,
      message: 'Instagram account disconnected successfully',
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect account',
    };
    return c.json(response, 500);
  }
});

/**
 * POST /api/instagram/accounts/:id/refresh-token
 * Manually refresh Instagram access token (protected)
 */
instagram.post('/accounts/:id/refresh-token', authMiddleware, zValidator('param', accountIdSchema), async (c) => {
  const { id } = c.req.valid('param');

  try {
    const { refreshInstagramToken } = await import('@/services/token-refresh.service');
    await refreshInstagramToken(id);

    const response: ApiResponse = {
      success: true,
      message: 'Token refreshed successfully',
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh token',
    };
    return c.json(response, 500);
  }
});

export default instagram;
