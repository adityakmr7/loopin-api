import { User } from '@prisma/client';

export type UserResponse = Omit<User, 'password'>;

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Instagram types
export interface InstagramAccountResponse {
  id: string;
  instagramUserId: string;
  username: string;
  profilePictureUrl?: string;
  followersCount?: number;
  followingCount?: number;
  mediaCount?: number;
  biography?: string;
  isBusinessAccount: boolean;
  isConnected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstagramOAuthState {
  token: string;
  userId: string;
  createdAt: number;
}
