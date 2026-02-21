import { prisma } from '@/config/database';
import { getDecryptedAccessToken } from '@/services/instagram-account.service';

const IG_API_BASE = 'https://graph.instagram.com/v21.0';

/**
 * Send a direct message via Instagram Graph API.
 * Requires instagram_manage_messages permission.
 */
export async function sendDM(
  senderAccountId: string,
  recipientIgUserId: string,
  messageText: string
): Promise<{ messageId: string }> {
  const accessToken = await getDecryptedAccessToken(senderAccountId);

  if (!accessToken) {
    throw new Error('No access token found for account');
  }

  const response = await fetch(`${IG_API_BASE}/me/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientIgUserId },
      message: { text: messageText },
      access_token: accessToken,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Instagram DM API error: ${err}`);
  }

  const result = (await response.json()) as { message_id: string };
  return { messageId: result.message_id };
}

/**
 * Send a DM in response to a comment, and record the result on InstagramComment.
 *
 * @param commentId - Our internal InstagramComment.commentId (Instagram's ID)
 * @param accountId - Our internal InstagramAccount.id
 * @param recipientIgUserId - Instagram user ID of the commenter (value.from.id from webhook)
 * @param dmText - Message to send
 */
export async function sendCommentToDM(
  commentId: string,
  accountId: string,
  recipientIgUserId: string,
  dmText: string
): Promise<void> {
  console.log(`📩 Sending DM to Instagram user ${recipientIgUserId} in response to comment ${commentId}`);

  try {
    const { messageId } = await sendDM(accountId, recipientIgUserId, dmText);
    console.log(`✅ DM sent. Message ID: ${messageId}`);

    // Record success on the comment record
    await prisma.instagramComment.update({
      where: { commentId },
      data: {
        dmSent: true,
        dmText,
        dmSentAt: new Date(),
        dmError: null,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to send DM for comment ${commentId}:`, errorMsg);

    // Record failure on the comment record
    await prisma.instagramComment.update({
      where: { commentId },
      data: {
        dmSent: false,
        dmError: errorMsg,
      },
    });

    throw error;
  }
}
