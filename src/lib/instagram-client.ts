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
   * Get user profile information
   * Using Instagram Login - direct /me endpoint (no Facebook Pages required)
   */
  async getUserProfile(): Promise<InstagramUserData> {
    const fields = 'id,username,account_type,media_count';
    return this.request<InstagramUserData>(
      `/me?fields=${fields}&access_token=${this.accessToken}`
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
