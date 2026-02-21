import type { AutomationRule } from '@prisma/client';

interface MatchContext {
  text: string;
  username: string;
  userId: string;
}

/**
 * Check if event matches rule conditions
 */
export function matchesConditions(
  context: MatchContext,
  conditions: any
): boolean {
  // Text contains (case-insensitive)
  if (conditions.text_contains) {
    const keywords = Array.isArray(conditions.text_contains)
      ? conditions.text_contains
      : [conditions.text_contains];
    
    const matches = keywords.some((keyword: string) =>
      context.text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (!matches) return false;
  }

  // Text equals
  if (conditions.text_equals) {
    if (context.text.toLowerCase() !== conditions.text_equals.toLowerCase()) {
      return false;
    }
  }

  // Text starts with
  if (conditions.text_starts_with) {
    if (!context.text.toLowerCase().startsWith(conditions.text_starts_with.toLowerCase())) {
      return false;
    }
  }

  // Text ends with
  if (conditions.text_ends_with) {
    if (!context.text.toLowerCase().endsWith(conditions.text_ends_with.toLowerCase())) {
      return false;
    }
  }

  // All conditions passed
  return true;
}

/**
 * Find matching rules for an event, applying user safety filters.
 * - Skips if commenter's username is in ignoredUsernames
 * - Skips if comment text contains any blocked keyword
 */
export async function findMatchingRules(
  accountId: string,
  trigger: string,
  context: MatchContext
): Promise<AutomationRule[]> {
  const { prisma } = await import('@/config/database');
  
  // Get active rules for this trigger
  const rules = await prisma.automationRule.findMany({
    where: {
      accountId,
      trigger,
      isActive: true,
    },
  });

  if (rules.length === 0) return [];

  // Fetch user settings for safety filters (userId is the same for all rules on an account)
  const userId = rules[0].userId;
  const userSettings = await prisma.userSettings.findUnique({ where: { userId } });

  if (userSettings) {
    const ignoredUsernames: string[] = userSettings.ignoredUsernames ?? [];
    const blockedKeywords: string[] = userSettings.blockedKeywords ?? [];

    // Skip if commenter is on the ignore list
    if (ignoredUsernames.some((u: string) => u.toLowerCase() === context.username.toLowerCase())) {
      console.log(`🚫 Skipping automation — @${context.username} is in ignoredUsernames`);
      return [];
    }

    // Skip if comment contains a blocked keyword
    const triggeredBlockedKeyword = blockedKeywords.find((kw: string) =>
      context.text.toLowerCase().includes(kw.toLowerCase())
    );
    if (triggeredBlockedKeyword) {
      console.log(`🚫 Skipping automation — comment contains blocked keyword: "${triggeredBlockedKeyword}"`);
      return [];
    }
  }

  // Filter rules that match conditions
  return rules.filter(rule => matchesConditions(context, rule.conditions));
}
