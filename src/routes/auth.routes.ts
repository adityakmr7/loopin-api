import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '@/middleware/auth.middleware';
import { register, login, refreshAccessToken, logout, logoutAll } from '@/services/auth.service';
import { findUserById } from '@/services/user.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '@/validators/auth.validator';
import type { ApiResponse } from '@/types';

const auth = new Hono();

/**
 * POST /api/auth/register
 * Register a new user
 */
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const data = c.req.valid('json');

  try {
    const result = await register(data);

    const response: ApiResponse = {
      success: true,
      message: 'User registered successfully',
      data: result,
    };

    return c.json(response, 201);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
    return c.json(response, 400);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const data = c.req.valid('json');

  try {
    const result = await login(data);

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      data: result,
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
    return c.json(response, 401);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
auth.post('/refresh', zValidator('json', refreshTokenSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');

  try {
    const tokens = await refreshAccessToken(refreshToken);

    const response: ApiResponse = {
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
    return c.json(response, 401);
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
auth.post('/logout', zValidator('json', refreshTokenSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');

  try {
    await logout(refreshToken);

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    };
    return c.json(response, 400);
  }
});

/**
 * GET /api/auth/me
 * Get current user (protected route)
 */
auth.get('/me', authMiddleware, async (c) => {
  const { userId } = c.get('user');

  try {
    const user = await findUserById(userId);

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found',
      };
      return c.json(response, 404);
    }

    const response: ApiResponse = {
      success: true,
      data: user,
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user',
    };
    return c.json(response, 500);
  }
});

/**
 * GET /api/auth/sessions
 * List all active refresh tokens (sessions) for the current user
 */
auth.get('/sessions', authMiddleware, async (c) => {
  const { userId } = c.get('user');

  try {
    const { prisma } = await import('@/config/database');
    const sessions = await prisma.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { id: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return c.json({ success: true, data: sessions });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch sessions' },
      500
    );
  }
});

/**
 * DELETE /api/auth/sessions
 * Revoke all sessions (logout from all devices)
 */
auth.delete('/sessions', authMiddleware, async (c) => {
  const { userId } = c.get('user');

  try {
    await logoutAll(userId);
    return c.json({ success: true, message: 'All sessions revoked' });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to revoke sessions' },
      500
    );
  }
});

/**
 * DELETE /api/auth/sessions/:id
 * Revoke a specific session by refresh token DB id
 */
auth.delete('/sessions/:id', authMiddleware, async (c) => {
  const { userId } = c.get('user');
  const { id } = c.req.param();

  try {
    const { prisma } = await import('@/config/database');
    const token = await prisma.refreshToken.findFirst({ where: { id, userId } });

    if (!token) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    await prisma.refreshToken.delete({ where: { id } });
    return c.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to revoke session' },
      500
    );
  }
});

export default auth;
