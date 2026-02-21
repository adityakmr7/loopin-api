import { prisma } from '@/config/database';

interface Interaction {
  id: string;
  commenter: {
    username: string;
  };
  comment: {
    text: string;
    timestamp: Date;
  };
  reply: {
    sent: boolean;
    text: string | null;
    repliedAt: Date | null;
  };
}

interface DashboardStats {
  activeRules: number;
  eventsProcessed: {
    total: number;
    period: string;
  };
  autoReplies: {
    total: number;
    period: string;
  };
  recentInteractions: Interaction[];
}

/**
 * Get dashboard statistics for an Instagram account
 */
export async function getDashboardStats(accountId: string): Promise<DashboardStats> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel for performance
  const [activeRules, eventsProcessed, autoReplies, recentComments] = await Promise.all([
    // Count active automation rules
    prisma.automationRule.count({
      where: {
        accountId,
        isActive: true,
      },
    }),

    // Count webhook events processed in last 30 days
    prisma.webhookEvent.count({
      where: {
        accountId,
        processed: true,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    }),

    // Count auto replies sent (comments we replied to)
    prisma.instagramComment.count({
      where: {
        accountId,
        replied: true,
      },
    }),

    // Get recent comment interactions with full detail
    prisma.instagramComment.findMany({
      where: {
        accountId,
        isReply: false, // Only top-level comments, not our own reply threads
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 20,
      select: {
        id: true,
        username: true,
        text: true,
        timestamp: true,
        replied: true,
        replyText: true,
        repliedAt: true,
      },
    }),
  ]);

  // Map to clean interaction shape
  const recentInteractions: Interaction[] = recentComments.map((comment) => ({
    id: comment.id,
    commenter: {
      username: comment.username,
    },
    comment: {
      text: comment.text,
      timestamp: comment.timestamp,
    },
    reply: {
      sent: comment.replied,
      text: comment.replyText ?? null,
      repliedAt: comment.repliedAt ?? null,
    },
  }));

  return {
    activeRules,
    eventsProcessed: {
      total: eventsProcessed,
      period: 'last_30_days',
    },
    autoReplies: {
      total: autoReplies,
      period: 'all_time',
    },
    recentInteractions,
  };
}



/**
 * Get overview stats for all connected accounts
 */
export async function getOverviewStats(userId: string) {
  const accounts = await prisma.instagramAccount.findMany({
    where: {
      userId,
      isConnected: true,
    },
    select: {
      id: true,
      username: true,
      followersCount: true,
      followingCount: true,
      mediaCount: true,
    },
  });

  // Get total stats across all accounts
  const totalActiveRules = await prisma.automationRule.count({
    where: {
      account: {
        userId,
        isConnected: true,
      },
      isActive: true,
    },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const totalEventsProcessed = await prisma.webhookEvent.count({
    where: {
      account: {
        userId,
        isConnected: true,
      },
      processed: true,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const totalAutoReplies = await prisma.webhookEvent.count({
    where: {
      account: {
        userId,
        isConnected: true,
      },
      eventType: 'comments',
      processed: true,
    },
  });

  return {
    accounts,
    totalActiveRules,
    totalEventsProcessed,
    totalAutoReplies,
  };
}
