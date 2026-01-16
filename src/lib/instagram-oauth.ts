import { config } from '@/config/env';

export interface InstagramTokenResponse {
  access_token: string;
  user_id: number;
  expires_in?: number;
}

export interface InstagramUserProfile {
  id: string;
  username: string;
  account_type?: string;
  media_count?: number;
}

/**
 * Generate Instagram OAuth authorization URL
 * Using Instagram Login (Business Login for Instagram)
 * This does NOT require a Facebook Page
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.instagram.appId,
    redirect_uri: config.instagram.redirectUri,
    response_type: 'code',
    scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments',
    state,
  });

  // Use Instagram OAuth (not Facebook OAuth)
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for short-lived access token
 * Using Instagram API (Business Login)
 * Returns a short-lived token (1 hour) that should be exchanged for long-lived token
 */
export async function exchangeCodeForToken(code: string): Promise<InstagramTokenResponse> {
  const formData = new URLSearchParams({
    client_id: config.instagram.appId,
    client_secret: config.instagram.appSecret,
    grant_type: 'authorization_code',
    redirect_uri: config.instagram.redirectUri,
    code,
  });

  const response = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json() as Promise<InstagramTokenResponse>;
}

/**
 * Get long-lived access token (valid for 60 days)
 */
export async function getLongLivedToken(shortLivedToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: config.instagram.appSecret,
    access_token: shortLivedToken,
  });

  const response = await fetch(
    `https://graph.instagram.com/access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get long-lived token: ${error}`);
  }

  return response.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>;
}

/**
 * Refresh long-lived access token
 */
export async function refreshAccessToken(accessToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: accessToken,
  });

  const response = await fetch(
    `https://graph.instagram.com/refresh_access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>;
}

/**
 * Generate a cryptographically secure state token
 */
export function generateStateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
