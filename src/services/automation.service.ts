import { prisma } from '@/config/database';
import { findMatchingRules } from './rule-matcher.service';
import { executeActions } from './action-executor.service';

/**
 * Process automation rules for a comment
 */
export async function processCommentAutomation(
  accountId: string,
  comment: {
    id: string;
    commentId: string;
    text: string;
    username: string;
  }
): Promise<void> {
  console.log(`🤖 Checking automation rules for comment: ${comment.commentId}`);

  // Find matching rules
  const matchingRules = await findMatchingRules(accountId, 'comment', {
    text: comment.text,
    username: comment.username,
    userId: comment.id,
  });

  if (matchingRules.length === 0) {
    console.log(`ℹ️ No matching rules found`);
    return;
  }

  console.log(`✅ Found ${matchingRules.length} matching rule(s)`);

  // Execute actions for each matching rule
  for (const rule of matchingRules) {
    try {
      console.log(`📋 Executing rule: ${rule.name}`);
      
      await executeActions(comment.commentId, accountId, rule.actions);
      
      // Update rule stats
      const actions = rule.actions as { reply?: string; like?: boolean; hide?: boolean };
      await prisma.automationRule.update({
        where: { id: rule.id },
        data: {
          triggerCount: { increment: 1 },
          replyCount: { increment: actions.reply ? 1 : 0 },
          likeCount: { increment: actions.like ? 1 : 0 },
          lastTriggered: new Date(),
        },
      });
      
      console.log(`✅ Rule executed: ${rule.name}`);
    } catch (error) {
      console.error(`❌ Failed to execute rule ${rule.name}:`, error);
    }
  }
}
