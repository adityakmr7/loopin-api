import { prisma } from '@/config/database';
import { encrypt, decrypt } from '@/lib/encryption';
import type { InstagramAccount, InstagramToken } from '@prisma/client';

/**
 * Create or update Instagram account
 */
export async function upsertInstagramAccount(data: {
  userId: string;
  instagramUserId: string;
  instagramBusinessAccountId?: string;
  username: string;
  profilePictureUrl?: string;
  followersCount?: number;
  followingCount?: number;
  mediaCount?: number;
  biography?: string;
  isBusinessAccount?: boolean;
}): Promise<InstagramAccount> {
  return prisma.instagramAccount.upsert({
    where: { instagramUserId: data.instagramUserId },
    update: {
      instagramBusinessAccountId: data.instagramBusinessAccountId,
      username: data.username,
      profilePictureUrl: data.profilePictureUrl,
      followersCount: data.followersCount,
      followingCount: data.followingCount,
      mediaCount: data.mediaCount,
      biography: data.biography,
      isBusinessAccount: data.isBusinessAccount,
      isConnected: true,
      updatedAt: new Date(),
    },
    create: data,
  });
}

/**
 * Store Instagram access token (encrypted)
 */
export async function storeInstagramToken(data: {
  instagramAccountId: string;
  accessToken: string;
  tokenType?: string;
  expiresAt?: Date;
  scope?: string;
}): Promise<InstagramToken> {
  const encryptedToken = encrypt(data.accessToken);

  return prisma.instagramToken.upsert({
    where: { instagramAccountId: data.instagramAccountId },
    update: {
      accessToken: encryptedToken,
      tokenType: data.tokenType || 'Bearer',
      expiresAt: data.expiresAt,
      scope: data.scope,
      updatedAt: new Date(),
    },
    create: {
      instagramAccountId: data.instagramAccountId,
      accessToken: encryptedToken,
      tokenType: data.tokenType || 'Bearer',
      expiresAt: data.expiresAt,
      scope: data.scope,
    },
  });
}

/**
 * Get Instagram account by ID
 */
export async function getInstagramAccountById(
  accountId: string
): Promise<(InstagramAccount & { tokens: InstagramToken | null }) | null> {
  return prisma.instagramAccount.findUnique({
    where: { id: accountId },
    include: { tokens: true },
  });
}

/**
 * Get Instagram accounts by user ID
 */
export async function getInstagramAccountsByUserId(
  userId: string
): Promise<InstagramAccount[]> {
  return prisma.instagramAccount.findMany({
    where: { userId, isConnected: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get decrypted access token
 */
export async function getDecryptedAccessToken(
  accountId: string
): Promise<string | null> {
  const account = await prisma.instagramAccount.findUnique({
    where: { id: accountId },
    include: { tokens: true },
  });

  if (!account?.tokens) {
    return null;
  }

  try {
    return decrypt(account.tokens.accessToken);
  } catch (error) {
    console.error('Failed to decrypt access token:', error);
    return null;
  }
}

/**
 * Disconnect Instagram account
 */
export async function disconnectInstagramAccount(accountId: string): Promise<void> {
  await prisma.instagramAccount.update({
    where: { id: accountId },
    data: { isConnected: false },
  });
}

/**
 * Delete Instagram account and tokens
 */
export async function deleteInstagramAccount(accountId: string): Promise<void> {
  await prisma.instagramAccount.delete({
    where: { id: accountId },
  });
}

/**
 * Check if user owns Instagram account
 */
export async function userOwnsInstagramAccount(
  userId: string,
  accountId: string
): Promise<boolean> {
  const account = await prisma.instagramAccount.findFirst({
    where: {
      id: accountId,
      userId,
    },
  });

  return !!account;
}
