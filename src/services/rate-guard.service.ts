/**
 * In-memory per-account rate guard for automation replies.
 * Tracks how many replies have been sent per account within the current 1-hour window.
 * Resets automatically when the window expires.
 *
 * Note: This is process-local. For multi-instance deployments, migrate to Redis.
 */

interface WindowState {
  count: number;
  windowStart: number; // epoch ms
}

const windows = new Map<string, WindowState>();
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Check if the account is allowed to send another reply.
 * @param accountId - Internal account ID
 * @param maxPerHour - Limit configured in UserSettings
 */
export function canReply(accountId: string, maxPerHour: number): boolean {
  const now = Date.now();
  const state = windows.get(accountId);

  if (!state || now - state.windowStart >= ONE_HOUR_MS) {
    // Window expired or not yet started — always allowed
    return true;
  }

  return state.count < maxPerHour;
}

/**
 * Record a reply sent for an account, incrementing its hourly counter.
 * @param accountId - Internal account ID
 */
export function recordReply(accountId: string): void {
  const now = Date.now();
  const state = windows.get(accountId);

  if (!state || now - state.windowStart >= ONE_HOUR_MS) {
    windows.set(accountId, { count: 1, windowStart: now });
  } else {
    state.count += 1;
  }
}

/**
 * Get current reply count for an account (useful for debug/monitoring).
 */
export function getReplyCount(accountId: string): number {
  const now = Date.now();
  const state = windows.get(accountId);
  if (!state || now - state.windowStart >= ONE_HOUR_MS) return 0;
  return state.count;
}
