import { prisma } from '@/config/database';

interface CommentEvent {
  field: 'comments';
  value: {
    id: string;
    text: string;
    from: {
      id: string;
      username: string;
    };
    media: {
      id: string;
      media_product_type: string;
    };
  };
}

/**
 * Handle comment webhook event
 */
export async function handleCommentEvent(
  accountId: string,
  event: CommentEvent
): Promise<void> {
  console.log('💬 Processing comment event:', event.value.id);

  try {
    // Store comment in database
    await prisma.instagramComment.create({
      data: {
        commentId: event.value.id,
        accountId,
        mediaId: event.value.media.id,
        text: event.value.text,
        username: event.value.from.username,
        timestamp: new Date(),
        isReply: false,
      },
    });

    console.log('✅ Comment stored:', event.value.id);

    // TODO: Trigger automation rules
    // await checkAutomationRules(accountId, 'comment', event.value);
  } catch (error) {
    console.error('❌ Error storing comment:', error);
    throw error;
  }
}

/**
 * Get comments for an account
 */
export async function getCommentsByAccount(
  accountId: string,
  limit: number = 50
) {
  return prisma.instagramComment.findMany({
    where: { accountId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Mark comment as replied
 */
export async function markCommentReplied(
  commentId: string,
  replyText: string
): Promise<void> {
  await prisma.instagramComment.update({
    where: { commentId },
    data: {
      replied: true,
      replyText,
      repliedAt: new Date(),
    },
  });
}
