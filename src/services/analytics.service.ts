import { prisma } from '@/config/database';

type Period = '7d' | '30d' | '90d';

const PERIOD_DAYS: Record<Period, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

/**
 * Generate an array of ISO date strings (YYYY-MM-DD) for every day in the period,
 * starting from `days` days ago up to and including today.
 */
function buildDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export interface AnalyticsOverview {
  summary: {
    totalTriggers: number;
    totalRepliesSent: number;
    totalLikes: number;
    replyRate: number;
  };
  chart: Array<{
    date: string;
    triggers: number;
    replies: number;
    likes: number;
  }>;
  topRules: Array<{
    id: string;
    name: string;
    trigger: string;
    triggerCount: number;
    replyCount: number;
    likeCount: number;
    lastTriggered: string | null;
  }>;
  triggerBreakdown: {
    comment: number;
    mention: number;
  };
}

/**
 * Compute analytics overview for a given Instagram account and time period.
 */
export async function getAnalyticsOverview(
  accountId: string,
  period: Period
): Promise<AnalyticsOverview> {
  const days = PERIOD_DAYS[period];
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - days);
  startDate.setUTCHours(0, 0, 0, 0);

  const [
    totalTriggers,
    totalRepliesSent,
    likesAggregate,
    webhookEventsByDay,
    repliesByDay,
    automationRules,
    commentCount,
    mentionCount,
  ] = await Promise.all([
    // Total processed webhook events in the period (= automation trigger events)
    prisma.webhookEvent.count({
      where: {
        accountId,
        processed: true,
        createdAt: { gte: startDate },
      },
    }),

    // Total auto-replies sent in the period (comments marked as replied)
    prisma.instagramComment.count({
      where: {
        accountId,
        replied: true,
        repliedAt: { gte: startDate },
      },
    }),

    // Sum of likeCount across all rules for this account (cumulative, rule-level)
    prisma.automationRule.aggregate({
      where: { accountId },
      _sum: { likeCount: true },
    }),

    // Webhook events grouped by day (for chart triggers & replies per day)
    prisma.$queryRaw<Array<{ date: string; triggers: bigint; replies: bigint }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
        COUNT(*) FILTER (WHERE processed = true)                                  AS triggers,
        COUNT(*) FILTER (WHERE processed = true AND "eventType" = 'comments')     AS replies
      FROM "webhook_events"
      WHERE "accountId" = ${accountId}
        AND "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC')
    `,

    // Replies by day from instagram_comments (more accurate for chart)
    prisma.$queryRaw<Array<{ date: string; replies: bigint }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "repliedAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
        COUNT(*) AS replies
      FROM "instagram_comments"
      WHERE "accountId" = ${accountId}
        AND replied = true
        AND "repliedAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "repliedAt" AT TIME ZONE 'UTC')
    `,

    // All automation rules for this account, ordered by triggerCount desc
    prisma.automationRule.findMany({
      where: { accountId },
      orderBy: { triggerCount: 'desc' },
      select: {
        id: true,
        name: true,
        trigger: true,
        triggerCount: true,
        replyCount: true,
        likeCount: true,
        lastTriggered: true,
      },
    }),

    // Trigger breakdown: comment events in period
    prisma.webhookEvent.count({
      where: {
        accountId,
        processed: true,
        eventType: 'comments',
        createdAt: { gte: startDate },
      },
    }),

    // Trigger breakdown: mention events in period
    prisma.webhookEvent.count({
      where: {
        accountId,
        processed: true,
        eventType: 'mentions',
        createdAt: { gte: startDate },
      },
    }),
  ]);

  // Build lookup maps from raw query results
  const triggersByDate = new Map<string, number>();
  for (const row of webhookEventsByDay) {
    triggersByDate.set(row.date, Number(row.triggers));
  }

  const repliesByDate = new Map<string, number>();
  for (const row of repliesByDay) {
    repliesByDate.set(row.date, Number(row.replies));
  }

  // Build chart with every day in range filled (0 for missing days)
  const dateRange = buildDateRange(days);
  const chart = dateRange.map((date) => ({
    date,
    triggers: triggersByDate.get(date) ?? 0,
    replies: repliesByDate.get(date) ?? 0,
    likes: 0, // likes are not date-stamped in the DB; tracked at rule level only
  }));

  const totalLikes = likesAggregate._sum.likeCount ?? 0;
  const replyRate =
    totalTriggers > 0
      ? Math.round((totalRepliesSent / totalTriggers) * 1000) / 10
      : 0;

  const topRules = automationRules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    trigger: rule.trigger,
    triggerCount: rule.triggerCount,
    replyCount: rule.replyCount,
    likeCount: rule.likeCount,
    lastTriggered: rule.lastTriggered ? rule.lastTriggered.toISOString() : null,
  }));

  return {
    summary: {
      totalTriggers,
      totalRepliesSent,
      totalLikes,
      replyRate,
    },
    chart,
    topRules,
    triggerBreakdown: {
      comment: commentCount,
      mention: mentionCount,
    },
  };
}
