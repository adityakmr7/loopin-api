import { prisma } from '@/config/database';
import type { InstagramAccountSnapshot } from '@prisma/client';

/**
 * Create a snapshot of Instagram account metrics
 */
export async function createAccountSnapshot(
  accountId: string,
  data: {
    followersCount: number;
    followingCount: number;
    mediaCount: number;
  }
): Promise<InstagramAccountSnapshot> {
  return prisma.instagramAccountSnapshot.create({
    data: {
      accountId,
      followersCount: data.followersCount,
      followingCount: data.followingCount,
      mediaCount: data.mediaCount,
    },
  });
}

/**
 * Get snapshots for an account within a date range
 */
export async function getAccountSnapshots(
  accountId: string,
  startDate?: Date,
  endDate?: Date
): Promise<InstagramAccountSnapshot[]> {
  return prisma.instagramAccountSnapshot.findMany({
    where: {
      accountId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

/**
 * Get the latest snapshot for an account
 */
export async function getLatestSnapshot(
  accountId: string
): Promise<InstagramAccountSnapshot | null> {
  return prisma.instagramAccountSnapshot.findFirst({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get growth statistics for an account
 */
export async function getGrowthStats(accountId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const snapshots = await getAccountSnapshots(accountId, startDate);

  if (snapshots.length === 0) {
    return null;
  }

  const oldest = snapshots[0];
  const latest = snapshots[snapshots.length - 1];

  const followerGrowth = latest.followersCount - oldest.followersCount;
  const followingGrowth = latest.followingCount - oldest.followingCount;
  const mediaGrowth = latest.mediaCount - oldest.mediaCount;

  const followerGrowthPercent =
    oldest.followersCount > 0
      ? ((followerGrowth / oldest.followersCount) * 100).toFixed(2)
      : '0';

  const followingGrowthPercent =
    oldest.followingCount > 0
      ? ((followingGrowth / oldest.followingCount) * 100).toFixed(2)
      : '0';

  return {
    period: {
      days,
      startDate: oldest.createdAt,
      endDate: latest.createdAt,
    },
    current: {
      followers: latest.followersCount,
      following: latest.followingCount,
      media: latest.mediaCount,
    },
    previous: {
      followers: oldest.followersCount,
      following: oldest.followingCount,
      media: oldest.mediaCount,
    },
    growth: {
      followers: followerGrowth,
      following: followingGrowth,
      media: mediaGrowth,
    },
    growthPercent: {
      followers: parseFloat(followerGrowthPercent),
      following: parseFloat(followingGrowthPercent),
    },
    snapshots: snapshots.map((s) => ({
      date: s.createdAt,
      followers: s.followersCount,
      following: s.followingCount,
      media: s.mediaCount,
    })),
  };
}

/**
 * Delete old snapshots (keep last N days)
 */
export async function cleanupOldSnapshots(accountId: string, keepDays: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - keepDays);

  return prisma.instagramAccountSnapshot.deleteMany({
    where: {
      accountId,
      createdAt: {
        lt: cutoffDate,
      },
    },
  });
}
