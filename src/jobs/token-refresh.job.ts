import cron from 'node-cron';
import { refreshExpiringTokens } from '@/services/token-refresh.service';

/**
 * Schedule token refresh job
 * Runs daily at 2 AM to refresh expiring tokens
 */
export function scheduleTokenRefreshJob() {
  // Run every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Starting token refresh job...');
    const startTime = Date.now();
    
    try {
      const results = await refreshExpiringTokens();
      const duration = Date.now() - startTime;
      
      console.log('✅ Token refresh job completed');
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Success: ${results.success}`);
      console.log(`   Failed: ${results.failed}`);
      
      if (results.errors.length > 0) {
        console.error('   Errors:', results.errors);
      }
    } catch (error) {
      console.error('❌ Token refresh job failed:', error);
    }
  });

  console.log('📅 Token refresh job scheduled (daily at 2 AM)');
}
