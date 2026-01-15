import { hash, compare } from 'bcryptjs';
import { sign, verify, type SignOptions } from 'jsonwebtoken';
import { config } from '@/config/env';
import type { JWTPayload } from '@/types';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

/**
 * Generate a JWT access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as any);
}

/**
 * Generate a JWT refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as any);
}

/**
 * Verify a JWT access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return verify(token, config.jwt.secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify a JWT refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return verify(token, config.jwt.refreshSecret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Calculate refresh token expiration date
 */
export function getRefreshTokenExpiration(): Date {
  const expiresIn = config.jwt.refreshExpiresIn;
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  
  if (!match) {
    throw new Error('Invalid refresh token expiration format');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const now = new Date();

  switch (unit) {
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'm':
      return new Date(now.getTime() + value * 60 * 1000);
    case 's':
      return new Date(now.getTime() + value * 1000);
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
  }
}
