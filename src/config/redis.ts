import IORedis from 'ioredis';
import { config } from '@/config/env';

let redisConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!redisConnection) {
    redisConnection = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    redisConnection.on('error', (error: unknown) => {
      console.error('❌ Redis connection error:', error);
    });
  }

  return redisConnection;
}
