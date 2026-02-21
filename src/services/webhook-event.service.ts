import { prisma } from '@/config/database';
import { createHash } from 'crypto';
import type { WebhookEvent } from '@prisma/client';

/**
 * Store a webhook event in the database
 */
export async function storeWebhookEvent(data: {
  eventType: string;
  instagramUserId: string;
  accountId: string;
  eventHash: string;
  payload: any;
}): Promise<WebhookEvent> {
  return prisma.webhookEvent.create({
    data: {
      eventType: data.eventType,
      instagramUserId: data.instagramUserId,
      accountId: data.accountId,
      eventHash: data.eventHash,
      payload: data.payload,
    },
  });
}

/**
 * Mark an event as processed
 */
export async function markEventProcessed(
  eventId: string,
  error?: string
): Promise<void> {
  await prisma.webhookEvent.update({
    where: { id: eventId },
    data: {
      processed: true,
      processedAt: new Date(),
      error,
    },
  });
}

/**
 * Record an event processing failure without marking it processed.
 */
export async function markEventFailed(
  eventId: string,
  error: string
): Promise<void> {
  await prisma.webhookEvent.update({
    where: { id: eventId },
    data: {
      processed: false,
      processedAt: null,
      error,
    },
  });
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string): Promise<WebhookEvent | null> {
  return prisma.webhookEvent.findUnique({
    where: { id: eventId },
  });
}

/**
 * Create a deterministic hash for idempotency from the event payload.
 */
export function computeWebhookEventHash(input: {
  accountId: string;
  field: string;
  value: any;
}): string {
  const serialized = JSON.stringify({
    accountId: input.accountId,
    field: input.field,
    value: input.value,
  });

  return createHash('sha256').update(serialized).digest('hex');
}

/**
 * Get all unprocessed events
 */
export async function getUnprocessedEvents(): Promise<WebhookEvent[]> {
  return prisma.webhookEvent.findMany({
    where: { processed: false },
    orderBy: { createdAt: 'asc' },
    take: 100, // Limit to 100 at a time
  });
}

/**
 * Get events by account ID
 */
export async function getEventsByAccount(
  accountId: string,
  limit: number = 50
): Promise<WebhookEvent[]> {
  return prisma.webhookEvent.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
