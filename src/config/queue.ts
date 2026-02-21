import { Queue } from 'bullmq';
import { config } from '@/config/env';

export const WEBHOOK_EVENTS_QUEUE = 'webhook-events';
export const WEBHOOK_EVENTS_DLQ = 'webhook-events-dlq';

let webhookEventsQueue: Queue | null = null;
let webhookDeadLetterQueue: Queue | null = null;

export function getWebhookEventsQueue(): Queue {
  if (!webhookEventsQueue) {
    webhookEventsQueue = new Queue(WEBHOOK_EVENTS_QUEUE, {
      connection: getBullMqConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }

  return webhookEventsQueue;
}

export function getWebhookDeadLetterQueue(): Queue {
  if (!webhookDeadLetterQueue) {
    webhookDeadLetterQueue = new Queue(WEBHOOK_EVENTS_DLQ, {
      connection: getBullMqConnectionOptions(),
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
      },
    });
  }

  return webhookDeadLetterQueue;
}

export function getBullMqConnectionOptions() {
  const redisUrl = new URL(config.redis.url);
  const isTls = redisUrl.protocol === 'rediss:';

  return {
    host: redisUrl.hostname,
    port: redisUrl.port ? parseInt(redisUrl.port, 10) : 6379,
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: redisUrl.pathname ? parseInt(redisUrl.pathname.replace('/', ''), 10) || 0 : 0,
    ...(isTls ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
  };
}
