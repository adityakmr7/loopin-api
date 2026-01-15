import type { Context, Next } from 'hono';
import { verifyAccessToken } from '@/lib/auth';
import type { JWTPayload } from '@/types';

// Extend Hono context to include user
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to context
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      },
      401
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const payload = verifyAccessToken(token);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: error instanceof Error ? error.message : 'Invalid token',
      },
      401
    );
  }
}
