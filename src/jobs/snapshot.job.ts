import cron from 'node-cron';
import { prisma } from '@/config/database';
import { createInstagramClient } from '@/lib/instagram-client';
import { getDecryptedAccessToken } from '@/services/instagram-account.service';
import { createAccountSnapshot } from '@/services/instagram-snapshot.service';

/**
 * Daily job to snapshot Instagram account metrics
 * Runs at 3 AM every day
 */
export function scheduleSnapshotJob() {
  // Run at 3 AM every day
  cron.schedule('0 3 * * *', async () => {
    console.log('📸 Starting daily Instagram account snapshot job...');

    try {
      // Get all connected Instagram accounts
      const accounts = await prisma.instagramAccount.findMany({
        where: { isConnected: true },
        include: { tokens: true },
      });

      console.log(`📊 Found ${accounts.length} connected accounts to snapshot`);

      let successCount = 0;
      let errorCount = 0;

      for (const account of accounts) {
        try {
          // Get decrypted access token
          const accessToken = await getDecryptedAccessToken(account.id);
          if (!accessToken) {
            console.warn(`⚠️ No access token for account ${account.username}`);
            errorCount++;
            continue;
          }

          // Fetch latest profile data
          const client = createInstagramClient(accessToken);
          const profile = await client.getUserProfile();

          // Create snapshot
          await createAccountSnapshot(account.id, {
            followersCount: profile.followers_count || 0,
            followingCount: profile.follows_count || 0,
            mediaCount: profile.media_count || 0,
          });

          console.log(`✅ Snapshot created for @${account.username}`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to snapshot account ${account.username}:`, error);
          errorCount++;
        }
      }

      console.log(
        `📸 Snapshot job completed: ${successCount} successful, ${errorCount} failed`
      );
    } catch (error) {
      console.error('❌ Snapshot job failed:', error);
    }
  });

  console.log('📸 Instagram snapshot job scheduled (daily at 3 AM)');
}
