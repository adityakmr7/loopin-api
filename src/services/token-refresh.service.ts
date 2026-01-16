import { prisma } from '@/config/database';
import { decrypt, encrypt } from '@/lib/encryption';
import { refreshAccessToken } from '@/lib/instagram-oauth';

/**
 * Check if token needs refresh (< 7 days until expiry)
 */
export function needsRefresh(expiresAt: Date): boolean {
  const now = new Date();
  const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry < 7;
}

/**
 * Refresh a single Instagram token
 */
export async function refreshInstagramToken(accountId: string): Promise<void> {
  console.log(`🔄 Refreshing token for account ${accountId}...`);

  // Get current token
  const token = await prisma.instagramToken.findFirst({
    where: { instagramAccountId: accountId },
  });

  if (!token) {
    throw new Error('Token not found');
  }

  // Decrypt current token
  const currentToken = decrypt(token.accessToken);

  // Refresh token via Instagram API
  const refreshed = await refreshAccessToken(currentToken);

  // Calculate new expiry (60 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 60);

  // Update database
  await prisma.instagramToken.update({
    where: { id: token.id },
    data: {
      accessToken: encrypt(refreshed.access_token),
      expiresAt,
    },
  });

  console.log(`✅ Token refreshed successfully for account ${accountId}`);
}

/**
 * Find all tokens that need refresh
 */
export async function findTokensNeedingRefresh(): Promise<string[]> {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const tokens = await prisma.instagramToken.findMany({
    where: {
      expiresAt: {
        lte: sevenDaysFromNow,
      },
    },
    select: {
      instagramAccountId: true,
    },
  });

  return tokens.map(t => t.instagramAccountId);
}

/**
 * Refresh all expiring tokens
 */
export async function refreshExpiringTokens(): Promise<{
  success: number;
  failed: number;
  errors: Array<{ accountId: string; error: string }>;
}> {
  const accountIds = await findTokensNeedingRefresh();
  
  console.log(`📊 Found ${accountIds.length} token(s) needing refresh`);

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ accountId: string; error: string }>,
  };

  for (const accountId of accountIds) {
    try {
      await refreshInstagramToken(accountId);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      console.error(`❌ Failed to refresh token for account ${accountId}:`, error);
    }
  }

  return results;
}
