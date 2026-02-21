/**
 * Notification service — structured for easy email integration later.
 * Currently logs to console. Replace the log calls with Resend/Nodemailer
 * when email sending is ready.
 */

/**
 * Notify that an Instagram token is expiring soon.
 */
export async function notifyTokenExpiry(
  userId: string,
  username: string,
  expiresAt: Date
): Promise<void> {
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  console.warn(
    `⚠️  [TOKEN EXPIRY] Account @${username} (userId: ${userId}) — ` +
    `token expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} on ${expiresAt.toISOString()}`
  );

  // TODO: send email via Resend/Nodemailer
  // await sendEmail({
  //   to: userEmail,
  //   subject: `Your Instagram token for @${username} expires in ${daysLeft} days`,
  //   body: `...`,
  // });
}

/**
 * Notify that an automation rule failed to execute.
 */
export async function notifyRuleFailure(
  userId: string,
  ruleName: string,
  error: string
): Promise<void> {
  console.error(
    `❌ [RULE FAILURE] Rule "${ruleName}" (userId: ${userId}) failed: ${error}`
  );

  // TODO: send email
}
