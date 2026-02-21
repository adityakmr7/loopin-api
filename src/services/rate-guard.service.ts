/**
 * Redis-backed per-account rate guard for automation replies.
 * Tracks how many replies have been sent per account within the current 1-hour window.
 * Resets automatically when the window expires.
 */

import { getRedisConnection } from '@/config/redis';

const ONE_HOUR_MS = 60 * 60 * 1000;
const TTL_BUFFER_MS = 5 * 60 * 1000;

/**
 * Check if the account is allowed to send another reply.
 * @param accountId - Internal account ID
 * @param maxPerHour - Limit configured in UserSettings
 */
export async function canReply(accountId: string, maxPerHour: number): Promise<boolean> {
  const now = Date.now();
  const key = getWindowKey('reply', accountId, now);
  const redis = getRedisConnection();
  const count = await redis.get(key);

  if (!count) return true;
  return parseInt(count, 10) < maxPerHour;
}

/**
 * Record a reply sent for an account, incrementing its hourly counter.
 * @param accountId - Internal account ID
 */
export async function recordReply(accountId: string): Promise<void> {
  const now = Date.now();
  const key = getWindowKey('reply', accountId, now);
  const redis = getRedisConnection();
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.pexpire(key, ONE_HOUR_MS + TTL_BUFFER_MS);
  }
}

/**
 * Get current reply count for an account (useful for debug/monitoring).
 */
export async function getReplyCount(accountId: string): Promise<number> {
  const now = Date.now();
  const key = getWindowKey('reply', accountId, now);
  const redis = getRedisConnection();
  const count = await redis.get(key);
  return count ? parseInt(count, 10) : 0;
}

// ─── DM Rate Guard (Meta: ~200 DMs/hour) ─────────────────────────────────────

const DM_LIMIT_PER_HOUR = 200;

/**
 * Check if the account is allowed to send another DM.
 */
export async function canSendDM(accountId: string): Promise<boolean> {
  const now = Date.now();
  const key = getWindowKey('dm', accountId, now);
  const redis = getRedisConnection();
  const count = await redis.get(key);
  if (!count) return true;
  return parseInt(count, 10) < DM_LIMIT_PER_HOUR;
}

/**
 * Record a DM sent for an account.
 */
export async function recordDM(accountId: string): Promise<void> {
  const now = Date.now();
  const key = getWindowKey('dm', accountId, now);
  const redis = getRedisConnection();
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.pexpire(key, ONE_HOUR_MS + TTL_BUFFER_MS);
  }
}

/**
 * Get current DM count for an account.
 */
export async function getDMCount(accountId: string): Promise<number> {
  const now = Date.now();
  const key = getWindowKey('dm', accountId, now);
  const redis = getRedisConnection();
  const count = await redis.get(key);
  return count ? parseInt(count, 10) : 0;
}

function getWindowKey(prefix: 'reply' | 'dm', accountId: string, nowMs: number): string {
  const windowStart = Math.floor(nowMs / ONE_HOUR_MS);
  return `rate:${prefix}:${accountId}:${windowStart}`;
}
