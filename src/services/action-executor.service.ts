import { getOrCreateSettings } from '@/services/settings.service';
import { canReply, recordReply } from '@/services/rate-guard.service';

/**
 * Sleep for a random number of milliseconds between min and max.
 */
function randomDelay(minSecs: number, maxSecs: number): Promise<void> {
  const ms = (Math.floor(Math.random() * (maxSecs - minSecs + 1)) + minSecs) * 1000;
  console.log(`⏳ Waiting ${ms}ms before executing action (human-like delay)...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute rule actions
 */
export async function executeActions(
  commentId: string,
  accountId: string,
  actions: any,
  userId: string
): Promise<void> {
  console.log(`🎬 Executing actions for comment ${commentId}`);

  // Load user settings
  const settings = await getOrCreateSettings(userId);

  // Per-account rate limit check
  if (!canReply(accountId, settings.maxRepliesPerHour)) {
    console.warn(
      `🚫 Rate limit reached for account ${accountId} — ` +
      `max ${settings.maxRepliesPerHour} replies/hour. Skipping.`
    );
    return;
  }

  // Human-like delay before any action
  if (settings.replyDelayMaxSecs > 0) {
    await randomDelay(settings.replyDelayMinSecs, settings.replyDelayMaxSecs);
  }

  // Reply to comment
  if (actions.reply) {
    try {
      await replyToComment(commentId, accountId, actions.reply);
      recordReply(accountId);
    } catch (error) {
      console.error(`❌ Failed to reply:`, error instanceof Error ? error.message : error);
    }
  }

  // Like comment
  if (actions.like) {
    try {
      await likeComment(commentId, accountId);
    } catch (error) {
      console.error(`❌ Failed to like:`, error instanceof Error ? error.message : error);
      // Instagram API often doesn't support liking comments, so we continue
    }
  }

  // Hide comment
  if (actions.hide) {
    try {
      await hideComment(commentId, accountId);
    } catch (error) {
      console.error(`❌ Failed to hide:`, error instanceof Error ? error.message : error);
    }
  }
}

/**
 * Reply to Instagram comment
 */
async function replyToComment(
  commentId: string,
  accountId: string,
  replyText: string
): Promise<void> {
  console.log(`💬 Replying to comment ${commentId}: "${replyText}"`);
  
  // Get access token
  const { getDecryptedAccessToken } = await import('@/services/instagram-account.service');
  const accessToken = await getDecryptedAccessToken(accountId);
  
  if (!accessToken) {
    throw new Error('Access token not found');
  }

  // Call Instagram API to reply
  const response = await fetch(
    `https://graph.instagram.com/${commentId}/replies?message=${encodeURIComponent(replyText)}&access_token=${accessToken}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to reply: ${error}`);
  }

  const result = (await response.json()) as { id: string };
  console.log(`✅ Reply posted: ${result.id}`);
  
  // Mark comment as replied in database
  const { markCommentReplied } = await import('@/services/webhook-handlers/comment-handler');
  await markCommentReplied(commentId, replyText);
}

/**
 * Like Instagram comment
 */
async function likeComment(
  commentId: string,
  accountId: string
): Promise<void> {
  console.log(`❤️ Liking comment ${commentId}`);
  
  const { getDecryptedAccessToken } = await import('@/services/instagram-account.service');
  const accessToken = await getDecryptedAccessToken(accountId);
  
  if (!accessToken) {
    throw new Error('Access token not found');
  }

  const response = await fetch(
    `https://graph.instagram.com/${commentId}/likes?access_token=${accessToken}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to like: ${error}`);
  }

  console.log(`✅ Comment liked`);
}

/**
 * Hide Instagram comment
 */
async function hideComment(
  commentId: string,
  accountId: string
): Promise<void> {
  console.log(`🙈 Hiding comment ${commentId}`);
  
  const { getDecryptedAccessToken } = await import('@/services/instagram-account.service');
  const accessToken = await getDecryptedAccessToken(accountId);
  
  if (!accessToken) {
    throw new Error('Access token not found');
  }

  const response = await fetch(
    `https://graph.instagram.com/${commentId}?hide=true&access_token=${accessToken}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to hide: ${error}`);
  }

  console.log(`✅ Comment hidden`);
}
