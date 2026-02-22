import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3001'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  WEBHOOK_PROCESSING_MODE: z.enum(['queue', 'inline']).default('queue'),
  RATE_GUARD_MODE: z.enum(['redis', 'memory', 'auto']).default('auto'),
  INSTAGRAM_APP_ID: z.string().min(1),
  INSTAGRAM_APP_SECRET: z.string().min(1),
  INSTAGRAM_REDIRECT_URI: z.string().url(),
  INSTAGRAM_API_VERSION: z.string().default('v18.0'),
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  ENCRYPTION_KEY: z.string().min(32),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables');
  }
}

export const env = validateEnv();

export const config = {
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  app: {
    env: env.NODE_ENV,
    port: parseInt(env.PORT, 10),
    frontendUrl: env.FRONTEND_URL,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
  },
  cors: {
    origins: env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
  },
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  redis: {
    url: env.REDIS_URL,
  },
  webhooks: {
    processingMode: env.WEBHOOK_PROCESSING_MODE,
  },
  rateGuard: {
    mode: env.RATE_GUARD_MODE,
  },
  instagram: {
    appId: env.INSTAGRAM_APP_ID,
    appSecret: env.INSTAGRAM_APP_SECRET,
    redirectUri: env.INSTAGRAM_REDIRECT_URI,
    apiVersion: env.INSTAGRAM_API_VERSION,
    webhookVerifyToken: env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || '',
  },
  encryption: {
    key: env.ENCRYPTION_KEY,
  },
};
