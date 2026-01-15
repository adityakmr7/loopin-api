import { prisma } from '@/config/database';
import type { User } from '@prisma/client';
import type { UserResponse } from '@/types';

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<UserResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      password: false,
    },
  });

  return user;
}

/**
 * Find user by email (includes password for authentication)
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Find user by email (excludes password)
 */
export async function findUserByEmailSafe(email: string): Promise<UserResponse | null> {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      password: false,
    },
  });
}

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<UserResponse> {
  const user = await prisma.user.create({
    data,
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      password: false,
    },
  });

  return user;
}

/**
 * Update user
 */
export async function updateUser(
  id: string,
  data: Partial<Pick<User, 'name' | 'email'>>
): Promise<UserResponse> {
  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      password: false,
    },
  });

  return user;
}
