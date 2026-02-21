import { handleCommentEvent } from './webhook-handlers/comment-handler';
import { handleMentionEvent } from './webhook-handlers/mention-handler';
import { handleMessageEvent } from './webhook-handlers/message-handler';
import { storeWebhookEvent, markEventProcessed, computeWebhookEventHash } from './webhook-event.service';
import type { WebhookEvent } from '@prisma/client';

async function routeWebhookEvent(
  accountId: string,
  field: string,
  value: any
): Promise<void> {
  // Route to appropriate handler
  switch (field) {
    case 'comments':
      await handleCommentEvent(accountId, { field, value });
      break;
    case 'mentions':
      await handleMentionEvent(accountId, { field, value });
      break;
    case 'messages':
      await handleMessageEvent(accountId, { field, value });
      break;
    default:
      console.log(`⚠️ Unhandled event type: ${field}`);
  }
}

/**
 * Process a single webhook event
 */
export async function processWebhookEvent(
  accountId: string,
  field: string,
  value: any
): Promise<void> {
  console.log(`📨 Processing webhook event: ${field}`);

  // Store raw event first
  const event = await storeWebhookEvent({
    eventType: field,
    instagramUserId: value.from?.id || value.id || 'unknown',
    accountId,
    eventHash: computeWebhookEventHash({ accountId, field, value }),
    payload: { field, value },
  });

  try {
    await routeWebhookEvent(accountId, field, value);

    // Mark as processed
    await markEventProcessed(event.id);
    console.log(`✅ Event processed successfully: ${event.id}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Error processing event ${event.id}:`, error);
    
    // Mark as processed with error
    await markEventProcessed(event.id, errorMessage);
    
    // Re-throw to let caller know it failed
    throw error;
  }
}

/**
 * Process a stored webhook event (used by queue workers).
 * Note: marking processed/failed is handled by the worker.
 */
export async function processStoredWebhookEvent(event: WebhookEvent): Promise<void> {
  const payload = event.payload as { field?: string; value?: any } | null;
  const field = payload?.field;
  const value = payload?.value;

  if (!field) {
    throw new Error(`Invalid webhook payload for event ${event.id}: missing field`);
  }

  console.log(`📨 Processing stored webhook event: ${field}`);
  await routeWebhookEvent(event.accountId, field, value);
}
