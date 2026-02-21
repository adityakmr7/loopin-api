import { prisma } from '@/config/database';

interface CommentEvent {
  field: 'comments';
  value: {
    id: string;
    text: string;
    parent_id?: string;
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
    // Store comment in database (use upsert to handle duplicates)
    const comment = await prisma.instagramComment.upsert({
      where: { commentId: event.value.id },
      update: {
        text: event.value.text,
        timestamp: new Date(),
      },
      create: {
        commentId: event.value.id,
        accountId,
        mediaId: event.value.media.id,
        text: event.value.text,
        username: event.value.from.username,
        timestamp: new Date(),
        isReply: !!event.value.parent_id,
        parentId: event.value.parent_id,
      },
    });

    console.log('✅ Comment stored:', event.value.id);

    // Process automation rules
    const { processCommentAutomation } = await import('@/services/automation.service');
    await processCommentAutomation(accountId, {
      id: comment.id,
      commentId: comment.commentId,
      text: comment.text,
      username: comment.username,
      instagramUserId: event.value.from.id, // needed for DM sending
    });
  } catch (error) {
    console.error('❌ Error processing comment:', error);
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
