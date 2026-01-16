import { handleCommentEvent } from './webhook-handlers/comment-handler';
import { handleMentionEvent } from './webhook-handlers/mention-handler';
import { handleMessageEvent } from './webhook-handlers/message-handler';
import { storeWebhookEvent, markEventProcessed } from './webhook-event.service';

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
    payload: { field, value },
  });

  try {
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
