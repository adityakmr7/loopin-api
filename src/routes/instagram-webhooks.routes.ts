import { Hono } from 'hono';
import { config } from '@/config/env';
import type { ApiResponse } from '@/types';
import { prisma } from '@/config/database';
import { storeWebhookEvent, computeWebhookEventHash } from '@/services/webhook-event.service';
import { getWebhookEventsQueue } from '@/config/queue';
import { processStoredWebhookEvent } from '@/services/webhook-processor.service';
import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';

const webhooks = new Hono();

/**
 * GET /api/instagram/webhooks
 * Webhook verification endpoint
 * Instagram sends a GET request to verify the webhook URL
 */
webhooks.get('/', (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  // Check if mode and token are correct
  if (mode === 'subscribe' && token === config.instagram.webhookVerifyToken) {
    console.log('✅ Webhook verified');
    // Respond with the challenge token from the request
    return c.text(challenge || '');
  } else {
    console.log('❌ Webhook verification failed');
    return c.text('Forbidden', 403);
  }
});

/**
 * POST /api/instagram/webhooks
 * Webhook event handler
 * Instagram sends POST requests when events occur
 */
webhooks.post('/', async (c) => {
  const rawBody = await c.req.text();
  const signature256 = c.req.header('x-hub-signature-256');
  const signature = c.req.header('x-hub-signature');

  const isValid = verifySignature(rawBody, signature256, signature);
  if (!isValid) {
    console.warn('❌ Invalid webhook signature');
    return c.text('Forbidden', 403);
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return c.text('Invalid JSON', 400);
  }

  console.log('📩 Instagram webhook received:', JSON.stringify(body, null, 2));
  const useQueue = config.webhooks.processingMode === 'queue';
  const queue = useQueue ? getWebhookEventsQueue() : null;

  // Verify the request is from Instagram
  // In production, verify the X-Hub-Signature header

  // Process webhook events
  if (body.object === 'instagram') {
    for (const entry of body.entry || []) {
      const businessAccountId = entry.id; // This is the Instagram Business Account ID
      
      // Try to find account by business account ID first (new accounts)
      let account = await prisma.instagramAccount.findFirst({
        where: { instagramBusinessAccountId: businessAccountId },
      });

      // Fallback: Try to find by user ID (for old accounts that haven't been updated yet)
      if (!account) {
        account = await prisma.instagramAccount.findFirst({
          where: { instagramUserId: businessAccountId },
        });
        
        // If found via fallback, auto-update with business account ID
        if (account) {
          await prisma.instagramAccount.update({
            where: { id: account.id },
            data: { instagramBusinessAccountId: businessAccountId },
          });
          console.log(`✅ Auto-updated business account ID for @${account.username}`);
        }
      }

      if (!account) {
        console.log(`⚠️ Account not found for Instagram Business Account ID: ${businessAccountId}`);
        continue;
      }

      console.log(`📱 Processing events for account: ${account.username}`);
      
      // Process each change
      
      for (const change of entry.changes || []) {
        try {
          const eventHash = computeWebhookEventHash({
            accountId: account.id,
            field: change.field,
            value: change.value,
          });

          const event = await storeWebhookEvent({
            eventType: change.field,
            instagramUserId: change.value?.from?.id || change.value?.id || 'unknown',
            accountId: account.id,
            eventHash,
            payload: { field: change.field, value: change.value },
          });

          if (useQueue && queue) {
            await queue.add('webhook-event', { eventId: event.id }, { jobId: event.id });
          } else {
            await processStoredWebhookEvent(event);
            await prisma.webhookEvent.update({
              where: { id: event.id },
              data: {
                processed: true,
                processedAt: new Date(),
                error: null,
              },
            });
          }
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            console.log('ℹ️ Duplicate webhook event skipped');
            continue;
          }

          console.error(`❌ Failed to process change:`, error);
          // Continue processing other changes even if one fails
        }
      }
    }
  }

  // Always respond with 200 OK quickly
  return c.json({ success: true });
});

function verifySignature(
  rawBody: string,
  signature256?: string | null,
  signature?: string | null
): boolean {
  const appSecret = config.instagram.appSecret;

  if (!appSecret) {
    console.error('❌ INSTAGRAM_APP_SECRET is required for webhook signature verification');
    return false;
  }

  if (signature256 && signature256.startsWith('sha256=')) {
    const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
    return safeCompare(expected, signature256.replace('sha256=', ''));
  }

  if (signature && signature.startsWith('sha1=')) {
    const expected = createHmac('sha1', appSecret).update(rawBody).digest('hex');
    return safeCompare(expected, signature.replace('sha1=', ''));
  }

  return false;
}

function safeCompare(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  if (leftBuf.length !== rightBuf.length) return false;
  return timingSafeEqual(leftBuf, rightBuf);
}

export default webhooks;
