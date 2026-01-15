import type { Context, Next } from 'hono';
import { config } from '@/config/env';

/**
 * Global error handling middleware
 */
export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error('❌ Error:', error);

    const isDevelopment = config.app.isDevelopment;
    const statusCode = getStatusCode(error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    return c.json(
      {
        success: false,
        error: message,
        ...(isDevelopment && { stack: error instanceof Error ? error.stack : undefined }),
      },
      statusCode as any
    );
  }
}

/**
 * Get HTTP status code from error
 */
function getStatusCode(error: unknown): number {
  if (error instanceof Error) {
    // Check for common error messages and map to status codes
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('unauthorized') || error.message.includes('Invalid token')) return 401;
    if (error.message.includes('forbidden')) return 403;
    if (error.message.includes('validation') || error.message.includes('invalid')) return 400;
    if (error.message.includes('conflict') || error.message.includes('already exists')) return 409;
  }
  return 500;
}
