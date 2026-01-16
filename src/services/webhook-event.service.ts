import { prisma } from '@/config/database';
import type { WebhookEvent } from '@prisma/client';

/**
 * Store a webhook event in the database
 */
export async function storeWebhookEvent(data: {
  eventType: string;
  instagramUserId: string;
  accountId: string;
  payload: any;
}): Promise<WebhookEvent> {
  return prisma.webhookEvent.create({
    data: {
      eventType: data.eventType,
      instagramUserId: data.instagramUserId,
      accountId: data.accountId,
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
