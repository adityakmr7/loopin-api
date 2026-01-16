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
 * Find matching rules for an event
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

  // Filter rules that match conditions
  return rules.filter(rule => matchesConditions(context, rule.conditions));
}
