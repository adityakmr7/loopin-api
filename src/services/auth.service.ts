import { prisma } from '@/config/database';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiration,
} from '@/lib/auth';
import { findUserByEmail, createUser } from './user.service';
import type { AuthTokens, UserResponse } from '@/types';

/**
 * Register a new user
 */
export async function register(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ user: UserResponse; tokens: AuthTokens }> {
  // Check if user already exists
  const existingUser = await findUserByEmail(data.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await createUser({
    email: data.email,
    password: hashedPassword,
    name: data.name,
  });

  // Generate tokens
  const tokens = await generateTokensForUser(user.id, user.email);

  return { user, tokens };
}

/**
 * Login user
 */
export async function login(data: {
  email: string;
  password: string;
}): Promise<{ user: UserResponse; tokens: AuthTokens }> {
  // Find user
  const user = await findUserByEmail(data.email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await verifyPassword(data.password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate tokens
  const tokens = await generateTokensForUser(user.id, user.email);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, tokens };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Check if refresh token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    throw new Error('Invalid refresh token');
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    throw new Error('Refresh token expired');
  }

  // Generate new tokens
  const tokens = await generateTokensForUser(payload.userId, payload.email);

  // Delete old refresh token
  await prisma.refreshToken.delete({
    where: { id: storedToken.id },
  });

  return tokens;
}

/**
 * Logout user
 */
export async function logout(refreshToken: string): Promise<void> {
  // Delete refresh token from database
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
}

/**
 * Logout user from all devices
 */
export async function logoutAll(userId: string): Promise<void> {
  // Delete all refresh tokens for user
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

/**
 * Generate access and refresh tokens for user
 */
async function generateTokensForUser(userId: string, email: string): Promise<AuthTokens> {
  const payload = { userId, email };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: getRefreshTokenExpiration(),
    },
  });

  return { accessToken, refreshToken };
}
