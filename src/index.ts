import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { config } from '@/config/env';
import { errorMiddleware } from '@/middleware/error.middleware';
import { rateLimitMiddleware } from '@/middleware/rate-limit.middleware';
import healthRoutes from '@/routes/health.routes';
import authRoutes from '@/routes/auth.routes';
import instagramRoutes from '@/routes/instagram.routes';
import instagramWebhooks from '@/routes/instagram-webhooks.routes';
import automationRoutes from '@/routes/automation.routes';

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
app.route('/api/instagram', instagramRoutes);
app.route('/api/instagram/webhooks', instagramWebhooks);
app.route('/api/automation', automationRoutes);

// Start scheduled jobs
import { scheduleTokenRefreshJob } from '@/jobs/token-refresh.job';
import { scheduleSnapshotJob } from '@/jobs/snapshot.job';
scheduleTokenRefreshJob();
scheduleSnapshotJob();

// Root endpoint
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Loopin API - Instagram Automation SaaS',
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
      instagram: {
        auth: 'GET /api/instagram/auth (protected)',
        callback: 'GET /api/instagram/callback',
        accounts: 'GET /api/instagram/accounts (protected)',
        accountDetails: 'GET /api/instagram/accounts/:id (protected)',
        refreshAccount: 'POST /api/instagram/accounts/:id/refresh (protected)',
        disconnect: 'POST /api/instagram/accounts/:id/disconnect (protected)',
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
