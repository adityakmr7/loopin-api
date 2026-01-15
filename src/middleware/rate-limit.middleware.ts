import { rateLimiter } from 'hono-rate-limiter';
import { config } from '@/config/env';

/**
 * Rate limiting middleware
 * Limits requests per IP address
 */
export const rateLimitMiddleware = rateLimiter({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.maxRequests,
  standardHeaders: 'draft-6',
  keyGenerator: (c) => c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown',
});
