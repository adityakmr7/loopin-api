import { prisma } from '@/config/database';

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
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

/**
 * Get dashboard statistics for an Instagram account
 */
export async function getDashboardStats(accountId: string): Promise<DashboardStats> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel for performance
  const [activeRules, eventsProcessed, autoReplies, recentEvents] = await Promise.all([
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

    // Count auto replies (comment events that were processed)
    prisma.webhookEvent.count({
      where: {
        accountId,
        eventType: 'comments',
        processed: true,
      },
    }),

    // Get recent webhook events for activity feed
    prisma.webhookEvent.findMany({
      where: {
        accountId,
        processed: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        eventType: true,
        payload: true,
        createdAt: true,
      },
    }),
  ]);

  // Format recent activity
  const recentActivity = recentEvents.map((event) => {
    const payload = event.payload as any;
    // Payload is stored as { field, value } — username lives at payload.value.from.username
    const from = payload.value?.from || payload.from;
    const username = from?.username || from?.id || null;
    const displayName = username ? `@${username}` : 'someone';
    let description = '';

    switch (event.eventType) {
      case 'comments':
        description = `New comment from ${displayName}`;
        break;
      case 'mentions':
        description = `Mentioned by ${displayName}`;
        break;
      case 'messages':
        description = `New message from ${displayName}`;
        break;
      default:
        description = `${event.eventType} event received`;
    }

    return {
      id: event.id,
      type: event.eventType,
      description,
      username: username ?? null,
      timestamp: event.createdAt,
    };
  });

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
    recentActivity,
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
