import {
  exchangeCodeForToken,
  getLongLivedToken,
  refreshAccessToken as refreshInstagramToken,
} from '@/lib/instagram-oauth';
import { createInstagramClient } from '@/lib/instagram-client';
import {
  upsertInstagramAccount,
  storeInstagramToken,
  getInstagramAccountById,
  getInstagramAccountsByUserId,
  getDecryptedAccessToken,
  disconnectInstagramAccount as disconnectAccount,
} from './instagram-account.service';
import type { InstagramAccount } from '@prisma/client';

/**
 * Connect Instagram account via OAuth
 * Using Facebook Graph API - token is already long-lived
 */
export async function connectInstagramAccount(
  userId: string,
  code: string
): Promise<InstagramAccount> {
  // Step 1: Exchange code for short-lived access token (1 hour)
  const tokenResponse = await exchangeCodeForToken(code);
  const shortLivedToken = tokenResponse.access_token;

  // Step 2: Exchange short-lived token for long-lived token (60 days)
  const longLivedTokenResponse = await getLongLivedToken(shortLivedToken);
  const accessToken = longLivedTokenResponse.access_token;

  // Step 3: Fetch user profile using Instagram API
  const client = createInstagramClient(accessToken);
  const profile = await client.getUserProfile();

  // Step 3.5: Explicitly subscribe to webhooks
  // This is required to link the Instagram Account to the App's Webhooks
  try {
    const fields = 'comments,mentions,messages';
    console.log(`🔌 Attempting to subscribe to fields: ${fields}`);
    
    // Using v19.0 (latest) for better compatibility
    const response = await fetch(`https://graph.instagram.com/v19.0/me/subscribed_apps?access_token=${accessToken}&subscribed_fields=${fields}`, {
      method: 'POST'
    });
    
    const responseBody = await response.json();
    
    if (!response.ok) {
        console.error('❌ Webhook Subscription Failed:', JSON.stringify(responseBody, null, 2));
    } else {
        console.log('✅ Explicitly subscribed to Instagram webhooks:', JSON.stringify(responseBody));
    }
  } catch (error) {
    console.warn('⚠️ Failed to explicitly subscribe to webhooks:', error);
    // Don't fail the connection, it might already be subscribed auto-magically
  }

  // Long-lived tokens expire in 60 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 60);

  // Store account
  const account = await upsertInstagramAccount({
    userId,
    instagramUserId: profile.id,
    username: profile.username,
    mediaCount: profile.media_count,
    isBusinessAccount: profile.account_type === 'BUSINESS' || profile.account_type === 'MEDIA_CREATOR',
  });

  // Store encrypted token
  await storeInstagramToken({
    instagramAccountId: account.id,
    accessToken: accessToken,
    tokenType: 'Bearer',
    expiresAt,
    scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments',
  });

  return account;
}

/**
 * Refresh Instagram account data
 */
export async function refreshAccountData(accountId: string): Promise<InstagramAccount> {
  const accessToken = await getDecryptedAccessToken(accountId);
  if (!accessToken) {
    throw new Error('Access token not found');
  }

  const client = createInstagramClient(accessToken);
  const profile = await client.getUserProfile();

  const account = await getInstagramAccountById(accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  return upsertInstagramAccount({
    userId: account.userId,
    instagramUserId: profile.id,
    username: profile.username,
    mediaCount: profile.media_count,
    isBusinessAccount: profile.account_type === 'BUSINESS' || profile.account_type === 'MEDIA_CREATOR',
  });
}

/**
 * Get user's connected Instagram accounts
 */
export async function getUserInstagramAccounts(
  userId: string
): Promise<InstagramAccount[]> {
  return getInstagramAccountsByUserId(userId);
}

/**
 * Get Instagram account details
 */
export async function getAccountDetails(
  accountId: string
): Promise<InstagramAccount | null> {
  const account = await getInstagramAccountById(accountId);
  if (!account) {
    return null;
  }

  // Don't return the token in the response
  const { tokens, ...accountData } = account;
  return accountData as InstagramAccount;
}

/**
 * Disconnect Instagram account
 */
export async function disconnectInstagramAccount(accountId: string): Promise<void> {
  await disconnectAccount(accountId);
}

/**
 * Refresh access token if needed
 */
export async function refreshAccessTokenIfNeeded(accountId: string): Promise<void> {
  const account = await getInstagramAccountById(accountId);
  if (!account?.tokens) {
    throw new Error('Account or token not found');
  }

  const now = new Date();
  const expiresAt = account.tokens.expiresAt;

  // Refresh if token expires in less than 7 days
  if (expiresAt && expiresAt.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
    const accessToken = await getDecryptedAccessToken(accountId);
    if (!accessToken) {
      throw new Error('Failed to decrypt access token');
    }

    const refreshed = await refreshInstagramToken(accessToken);

    const newExpiresAt = new Date();
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshed.expires_in);

    await storeInstagramToken({
      instagramAccountId: accountId,
      accessToken: refreshed.access_token,
      tokenType: refreshed.token_type,
      expiresAt: newExpiresAt,
    });
  }
}
