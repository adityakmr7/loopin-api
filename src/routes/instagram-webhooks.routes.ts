import { Hono } from 'hono';
import { config } from '@/config/env';
import type { ApiResponse } from '@/types';
import { prisma } from '@/config/database';
import { processWebhookEvent } from '@/services/webhook-processor.service';

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
  const body = await c.req.json();
  console.log("body", body)

  console.log('📩 Instagram webhook received:', JSON.stringify(body, null, 2));

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
          await processWebhookEvent(account.id, change.field, change.value);
        } catch (error) {
          console.error(`❌ Failed to process change:`, error);
          // Continue processing other changes even if one fails
        }
      }
    }
  }

  // Always respond with 200 OK quickly
  return c.json({ success: true });
});

export default webhooks;
