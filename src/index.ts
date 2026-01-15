import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { config } from '@/config/env';
import { errorMiddleware } from '@/middleware/error.middleware';
import { rateLimitMiddleware } from '@/middleware/rate-limit.middleware';
import healthRoutes from '@/routes/health.routes';
import authRoutes from '@/routes/auth.routes';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: config.cors.origins,
    credentials: true,
  })
);
app.use('*', errorMiddleware);
app.use('*', rateLimitMiddleware);

// Routes
app.route('/health', healthRoutes);
app.route('/api/auth', authRoutes);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Loopin API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      healthDb: '/health/db',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me (protected)',
      },
    },
  });
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: 'The requested resource was not found',
    },
    404
  );
});

// Start server
const port = config.app.port;

console.log(`🚀 Server starting on port ${port}...`);
console.log(`📝 Environment: ${config.app.env}`);

export default {
  port,
  fetch: app.fetch,
};
