import { config } from '@/config/env';

export interface InstagramAPIError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export interface InstagramUserData {
  id: string;
  username: string;
  account_type?: 'BUSINESS' | 'MEDIA_CREATOR' | 'PERSONAL';
  media_count?: number;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  timestamp: string;
  username: string;
}

export interface InstagramMediaResponse {
  data: InstagramMedia[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

/**
 * Instagram API Client
 */
export class InstagramClient {
  private baseUrl = 'https://graph.instagram.com';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Make API request with error handling
   */
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as InstagramAPIError;
        throw new Error(
          `Instagram API Error: ${error.error.message} (${error.error.type})`
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown Instagram API error');
    }
  }

  /**
   * Get Instagram Business Account ID from Facebook Page
   * The Facebook token needs to be used to get the connected Instagram account first
   */
  async getInstagramBusinessAccount(): Promise<{ instagram_business_account: { id: string } }> {
    // First, get the user's Facebook pages
    console.log('🔍 Fetching Facebook pages...');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${this.accessToken}`
    );
    
    if (!pagesResponse.ok) {
      const error = await pagesResponse.text();
      console.error('❌ Failed to get Facebook pages:', error);
      throw new Error(`Failed to get Facebook pages: ${error}`);
    }

    const pagesData: any = await pagesResponse.json();
    console.log('📄 Facebook pages response:', JSON.stringify(pagesData, null, 2));
    
    if (!pagesData.data || pagesData.data.length === 0) {
      console.error('❌ No Facebook pages found in response');
      throw new Error(
        'No Facebook pages found. Please:\n' +
        '1. Create a Facebook Page at facebook.com/pages/create\n' +
        '2. Link your Instagram Business account to that page\n' +
        '3. Make sure you authorized "pages_manage_metadata" permission during OAuth'
      );
    }

    console.log(`✅ Found ${pagesData.data.length} Facebook page(s)`);
    
    // Get the first page (you might want to let users select which page)
    const page = pagesData.data[0];
    console.log(`📄 Using page: ${page.name} (ID: ${page.id})`);
    const pageAccessToken = page.access_token;

    // Get Instagram Business Account connected to this page
    console.log('🔍 Fetching Instagram Business Account from page...');
    const igResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    if (!igResponse.ok) {
      const error = await igResponse.text();
      console.error('❌ Failed to get Instagram Business Account:', error);
      throw new Error(`Failed to get Instagram Business Account: ${error}`);
    }

    const igData: any = await igResponse.json();
    console.log('📱 Instagram account response:', JSON.stringify(igData, null, 2));

    if (!igData.instagram_business_account) {
      console.error('❌ No Instagram Business Account linked to page');
      throw new Error(
        `No Instagram Business Account found on page "${page.name}". Please:\n` +
        '1. Go to your Facebook Page → Settings → Instagram\n' +
        '2. Click "Connect Account"\n' +
        '3. Log in with your Instagram Business account\n' +
        '4. Make sure your Instagram is a Business or Creator account (not Personal)'
      );
    }

    console.log(`✅ Found Instagram Business Account: ${igData.instagram_business_account.id}`);
    return igData;
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId?: string): Promise<InstagramUserData> {
    // If no userId provided, get it from the connected Instagram Business Account
    if (!userId) {
      const accountData = await this.getInstagramBusinessAccount();
      userId = accountData.instagram_business_account.id;
    }
    
    const fields = 'id,username,account_type,media_count';
    return this.request<InstagramUserData>(
      `/${userId}?fields=${fields}&access_token=${this.accessToken}`
    );
  }

  /**
   * Get user media
   */
  async getUserMedia(
    userId: string = 'me',
    limit: number = 25
  ): Promise<InstagramMediaResponse> {
    const fields = 'id,caption,media_type,media_url,permalink,timestamp,username';
    return this.request<InstagramMediaResponse>(
      `/${userId}/media?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`
    );
  }

  /**
   * Get media by ID
   */
  async getMedia(mediaId: string): Promise<InstagramMedia> {
    const fields = 'id,caption,media_type,media_url,permalink,timestamp,username';
    return this.request<InstagramMedia>(
      `/${mediaId}?fields=${fields}&access_token=${this.accessToken}`
    );
  }

  /**
   * Validate access token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getUserProfile();
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Create Instagram client instance
 */
export function createInstagramClient(accessToken: string): InstagramClient {
  return new InstagramClient(accessToken);
}
