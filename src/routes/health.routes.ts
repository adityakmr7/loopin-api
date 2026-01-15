import { Hono } from 'hono';
import { testDatabaseConnection } from '@/config/database';
import type { ApiResponse } from '@/types';

const health = new Hono();

/**
 * Basic health check
 */
health.get('/', (c) => {
  const response: ApiResponse = {
    success: true,
    message: 'API is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  };
  return c.json(response);
});

/**
 * Database health check
 */
health.get('/db', async (c) => {
  const isConnected = await testDatabaseConnection();

  if (!isConnected) {
    const response: ApiResponse = {
      success: false,
      error: 'Database connection failed',
    };
    return c.json(response, 503);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Database is connected',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  };
  return c.json(response);
});

export default health;
