import cron from 'node-cron';
import { prisma } from '@/config/database';
import { notifyTokenExpiry } from '@/services/notification.service';

/**
 * Schedule token expiry alert job
 * Runs daily at 9 AM — warns for tokens expiring within 7 days.
 */
export function scheduleTokenExpiryAlertJob() {
  cron.schedule('0 9 * * *', async () => {
    console.log('🔔 Running token expiry alert check...');

    try {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const expiringTokens = await prisma.instagramToken.findMany({
        where: {
          expiresAt: {
            not: null,
            lte: sevenDaysFromNow,
            gte: new Date(), // not already expired
          },
        },
        include: {
          instagramAccount: {
            include: {
              user: {
                include: { settings: true },
              },
            },
          },
        },
      });

      if (expiringTokens.length === 0) {
        console.log('✅ No tokens expiring within 7 days');
        return;
      }

      for (const token of expiringTokens) {
        const account = token.instagramAccount;
        const user = account.user;
        const settings = user.settings;

        // Respect user preference
        if (settings && !settings.notifyOnTokenExpiry) {
          console.log(`ℹ️ Skipping expiry notification for @${account.username} (disabled in settings)`);
          continue;
        }

        await notifyTokenExpiry(user.id, account.username, token.expiresAt!);
      }

      console.log(`✅ Token expiry check complete — ${expiringTokens.length} token(s) expiring soon`);
    } catch (error) {
      console.error('❌ Token expiry alert job failed:', error);
    }
  });

  console.log('📅 Token expiry alert job scheduled (daily at 9 AM)');
}
