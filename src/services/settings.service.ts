import { prisma } from '@/config/database';
import type { Prisma } from '@prisma/client';

type UserSettings = Prisma.UserSettingsGetPayload<object>;

type UpdateSettingsData = Partial<
  Pick<
    UserSettings,
    | 'timezone'
    | 'maxRepliesPerHour'
    | 'replyDelayMinSecs'
    | 'replyDelayMaxSecs'
    | 'blockedKeywords'
    | 'ignoredUsernames'
    | 'notifyOnTokenExpiry'
    | 'notifyOnRuleFailure'
  >
>;

/**
 * Get user settings, creating defaults if they don't exist yet.
 */
export async function getOrCreateSettings(userId: string): Promise<UserSettings> {
  return prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

/**
 * Partially update user settings.
 */
export async function updateSettings(
  userId: string,
  data: UpdateSettingsData
): Promise<UserSettings> {
  return prisma.userSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}
