import { Hono } from 'hono';
import { config } from '@/config/env';
import type { ApiResponse } from '@/types';

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

  console.log('📩 Instagram webhook received:', JSON.stringify(body, null, 2));

  // Verify the request is from Instagram
  // In production, verify the X-Hub-Signature header

  // Process webhook events
  if (body.object === 'instagram') {
    for (const entry of body.entry || []) {
      // Process each change
      for (const change of entry.changes || []) {
        await processWebhookChange(change);
      }
    }
  }

  // Always respond with 200 OK quickly
  return c.json({ success: true });
});

/**
 * Process individual webhook changes
 */
async function processWebhookChange(change: any) {
  const { field, value } = change;

  console.log(`📬 Webhook event - Field: ${field}`);

  switch (field) {
    case 'comments':
      console.log('💬 New comment:', value);
      // TODO: Handle new comment
      // - Auto-reply based on rules
      // - Moderate spam
      // - Notify user
      break;

    case 'mentions':
      console.log('📢 New mention:', value);
      // TODO: Handle mention
      // - Track brand mentions
      // - Notify user
      break;

    case 'story_insights':
      console.log('📊 Story insights:', value);
      // TODO: Handle story insights
      // - Store analytics
      break;

    case 'messages':
      console.log('💌 New message:', value);
      // TODO: Handle DM
      // - Auto-reply
      // - Route to support
      break;

    default:
      console.log('ℹ️ Unhandled webhook field:', field);
  }
}

export default webhooks;
