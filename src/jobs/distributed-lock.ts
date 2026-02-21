import { randomUUID } from 'crypto';
import { getRedisConnection } from '@/config/redis';

const RELEASE_LOCK_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

export async function runWithDistributedLock(
  lockKey: string,
  ttlMs: number,
  jobName: string,
  job: () => Promise<void>
): Promise<void> {
  const redis = getRedisConnection();
  const token = randomUUID();

  const acquired = await redis.set(lockKey, token, 'PX', ttlMs, 'NX');
  if (!acquired) {
    console.log(`⏭️ Skipping ${jobName} - lock already held`);
    return;
  }

  try {
    await job();
  } finally {
    try {
      await redis.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, token);
    } catch (error) {
      console.error(`❌ Failed to release lock for ${jobName}:`, error);
    }
  }
}
