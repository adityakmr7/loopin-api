import { Job, Worker } from 'bullmq';
import {
  WEBHOOK_EVENTS_DLQ,
  WEBHOOK_EVENTS_QUEUE,
  getBullMqConnectionOptions,
  getWebhookDeadLetterQueue,
} from '@/config/queue';
import { getEventById, markEventFailed, markEventProcessed } from '@/services/webhook-event.service';
import { processStoredWebhookEvent } from '@/services/webhook-processor.service';

const worker = new Worker(
  WEBHOOK_EVENTS_QUEUE,
  async (job: Job<{ eventId: string }>) => {
    const { eventId } = job.data as { eventId: string };

    const event = await getEventById(eventId);
    if (!event) {
      console.warn(`⚠️ Webhook event not found: ${eventId}`);
      return;
    }

    if (event.processed) {
      console.log(`ℹ️ Webhook event already processed: ${eventId}`);
      return;
    }

    try {
      await processStoredWebhookEvent(event);
      await markEventProcessed(event.id);
      console.log(`✅ Webhook event processed: ${event.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await markEventFailed(event.id, message);
      console.error(`❌ Webhook event failed: ${event.id}`, error);
      throw error;
    }
  },
  {
    connection: getBullMqConnectionOptions(),
    concurrency: 5,
  }
);

worker.on('ready', () => {
  console.log('✅ Webhook worker ready');
});

worker.on('failed', async (job: Job<{ eventId: string }> | undefined, err: Error) => {
  console.error(`❌ Webhook worker job failed: ${job?.id}`, err);
  if (!job) return;

  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) {
    return;
  }

  const deadLetterQueue = getWebhookDeadLetterQueue();
  const deadLetterPayload = {
    originalQueue: WEBHOOK_EVENTS_QUEUE,
    eventId: (job.data as { eventId?: string }).eventId,
    jobId: job.id,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason ?? (err instanceof Error ? err.message : 'Unknown failure'),
    timestamp: new Date().toISOString(),
  };

  try {
    await deadLetterQueue.add('dead-letter-webhook-event', deadLetterPayload, {
      jobId: `dlq:${job.id}`,
      removeOnComplete: false,
      removeOnFail: false,
    });
    console.error(`🚨 Moved webhook job to dead-letter queue (${WEBHOOK_EVENTS_DLQ})`, deadLetterPayload);
  } catch (deadLetterError) {
    console.error('❌ Failed to enqueue dead-letter webhook event', deadLetterError);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down webhook worker...');
  await worker.close();
  process.exit(0);
});
