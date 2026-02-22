/**
 * Rate guard with runtime-selectable backend.
 * - redis: strict distributed counters
 * - memory: process-local counters (MVP fallback)
 * - auto: redis first, fallback to memory on connection errors
 */

import { getRedisConnection } from '@/config/redis';
import { config } from '@/config/env';

interface WindowState {
  count: number;
  windowStart: number;
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const TTL_BUFFER_MS = 5 * 60 * 1000;
const DM_LIMIT_PER_HOUR = 200;

const replyWindows = new Map<string, WindowState>();
const dmWindows = new Map<string, WindowState>();
let hasLoggedRedisFallback = false;

export async function canReply(accountId: string, maxPerHour: number): Promise<boolean> {
  return withBackend(
    async () => {
      const key = getWindowKey('reply', accountId, Date.now());
      const count = await getRedisConnection().get(key);
      if (!count) return true;
      return parseInt(count, 10) < maxPerHour;
    },
    () => canMemory(replyWindows, accountId, maxPerHour)
  );
}

export async function recordReply(accountId: string): Promise<void> {
  await withBackend(
    async () => {
      const key = getWindowKey('reply', accountId, Date.now());
      const redis = getRedisConnection();
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, ONE_HOUR_MS + TTL_BUFFER_MS);
      }
    },
    () => {
      recordMemory(replyWindows, accountId);
    }
  );
}

export async function getReplyCount(accountId: string): Promise<number> {
  return withBackend(
    async () => {
      const key = getWindowKey('reply', accountId, Date.now());
      const count = await getRedisConnection().get(key);
      return count ? parseInt(count, 10) : 0;
    },
    () => getMemory(replyWindows, accountId)
  );
}

export async function canSendDM(accountId: string): Promise<boolean> {
  return withBackend(
    async () => {
      const key = getWindowKey('dm', accountId, Date.now());
      const count = await getRedisConnection().get(key);
      if (!count) return true;
      return parseInt(count, 10) < DM_LIMIT_PER_HOUR;
    },
    () => canMemory(dmWindows, accountId, DM_LIMIT_PER_HOUR)
  );
}

export async function recordDM(accountId: string): Promise<void> {
  await withBackend(
    async () => {
      const key = getWindowKey('dm', accountId, Date.now());
      const redis = getRedisConnection();
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, ONE_HOUR_MS + TTL_BUFFER_MS);
      }
    },
    () => {
      recordMemory(dmWindows, accountId);
    }
  );
}

export async function getDMCount(accountId: string): Promise<number> {
  return withBackend(
    async () => {
      const key = getWindowKey('dm', accountId, Date.now());
      const count = await getRedisConnection().get(key);
      return count ? parseInt(count, 10) : 0;
    },
    () => getMemory(dmWindows, accountId)
  );
}

async function withBackend<T>(redisFn: () => Promise<T>, memoryFn: () => T): Promise<T> {
  const mode = config.rateGuard.mode;

  if (mode === 'memory') {
    return memoryFn();
  }

  if (mode === 'redis') {
    return redisFn();
  }

  try {
    return await redisFn();
  } catch (error) {
    if (!hasLoggedRedisFallback) {
      hasLoggedRedisFallback = true;
      console.warn('⚠️ Redis unavailable for rate guard, falling back to in-memory counters');
      console.warn(error);
    }
    return memoryFn();
  }
}

function canMemory(windows: Map<string, WindowState>, accountId: string, maxPerHour: number): boolean {
  const state = windows.get(accountId);
  const now = Date.now();

  if (!state || now - state.windowStart >= ONE_HOUR_MS) {
    return true;
  }

  return state.count < maxPerHour;
}

function recordMemory(windows: Map<string, WindowState>, accountId: string): void {
  const now = Date.now();
  const state = windows.get(accountId);

  if (!state || now - state.windowStart >= ONE_HOUR_MS) {
    windows.set(accountId, { count: 1, windowStart: now });
  } else {
    state.count += 1;
  }
}

function getMemory(windows: Map<string, WindowState>, accountId: string): number {
  const now = Date.now();
  const state = windows.get(accountId);
  if (!state || now - state.windowStart >= ONE_HOUR_MS) return 0;
  return state.count;
}

function getWindowKey(prefix: 'reply' | 'dm', accountId: string, nowMs: number): string {
  const windowStart = Math.floor(nowMs / ONE_HOUR_MS);
  return `rate:${prefix}:${accountId}:${windowStart}`;
}
