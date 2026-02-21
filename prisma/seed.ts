import { prisma } from '../src/config/database';
import { hash } from 'bcryptjs';
import { createHash } from 'crypto';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Subtract `days` from now, then go back `offsetWithinDay` more hours */
function daysAgo(days: number, offsetHours = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - offsetHours);
  return d;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildSeedEventHash(accountId: string, sourceId: string): string {
  return createHash('sha256').update(`${accountId}:${sourceId}`).digest('hex');
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting database seed...');

  // ── 1. User ──────────────────────────────────────────────────────────────
  const hashedPassword = await hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });

  console.log('✅ User:', user.email, '(password: password123)');

  // ── 2. Instagram account ─────────────────────────────────────────────────
  const account = await prisma.instagramAccount.upsert({
    where: { instagramUserId: 'ig_user_123456' },
    update: {},
    create: {
      userId: user.id,
      instagramUserId: 'ig_user_123456',
      instagramBusinessAccountId: 'ig_biz_789012',
      username: 'testbrand',
      profilePictureUrl: 'https://example.com/avatar.jpg',
      followersCount: 12_400,
      followingCount: 310,
      mediaCount: 87,
      biography: 'Official test brand account 🚀',
      isBusinessAccount: true,
      isConnected: true,
    },
  });

  console.log('✅ Instagram account:', account.username, '(id:', account.id + ')');

  // ── 3. Automation rules ──────────────────────────────────────────────────
  const rulesData = [
    {
      name: 'Pricing Auto-Reply',
      description: 'Auto-reply when someone asks about pricing',
      trigger: 'comment',
      conditions: { keywords: ['price', 'cost', 'how much'] },
      actions: { reply: 'DM us for pricing! 💬', like: true },
      triggerCount: 120,
      replyCount: 98,
      likeCount: 80,
      lastTriggered: daysAgo(1, 3),
    },
    {
      name: 'Giveaway Mention Handler',
      description: 'Auto-reply to giveaway mentions',
      trigger: 'mention',
      conditions: { keywords: ['giveaway', 'win', 'contest'] },
      actions: { reply: 'Thanks for joining! Stay tuned 🎉', like: false },
      triggerCount: 62,
      replyCount: 55,
      likeCount: 0,
      lastTriggered: daysAgo(2, 1),
    },
    {
      name: 'Support Comment Triage',
      description: 'Like support comments and remind them to DM',
      trigger: 'comment',
      conditions: { keywords: ['help', 'issue', 'problem', 'broken'] },
      actions: { reply: 'So sorry to hear that! Please DM us 🙏', like: true },
      triggerCount: 45,
      replyCount: 40,
      likeCount: 38,
      lastTriggered: daysAgo(3, 5),
    },
    {
      name: 'New Product Hype',
      description: 'Engage comments on new product posts',
      trigger: 'comment',
      conditions: { keywords: ['new', 'launch', 'drop'] },
      actions: { reply: 'Yes! Coming very soon 👀', like: true },
      triggerCount: 18,
      replyCount: 16,
      likeCount: 14,
      lastTriggered: daysAgo(7, 0),
    },
    {
      name: 'Thank You Auto-Like',
      description: 'Like all thank-you comments',
      trigger: 'comment',
      conditions: { keywords: ['thanks', 'thank you', 'love this'] },
      actions: { like: true },
      triggerCount: 97,
      replyCount: 0,
      likeCount: 78,
      lastTriggered: daysAgo(0, 2),
    },
  ];

  const rules: Array<{ id: string; name: string }> = [];

  for (const r of rulesData) {
    const rule = await prisma.automationRule.upsert({
      where: {
        id: (
          await prisma.automationRule
            .findFirst({ where: { accountId: account.id, name: r.name }, select: { id: true } })
            .then((x) => x ?? { id: `__new__${r.name}` })
        ).id,
      },
      update: r,
      create: {
        userId: user.id,
        accountId: account.id,
        isActive: true,
        ...r,
      },
    });
    rules.push({ id: rule.id, name: rule.name });
  }

  console.log(`✅ ${rules.length} automation rules created`);

  // ── 4. Webhook events (last 30 days) ─────────────────────────────────────
  // Delete old seed events to keep seed idempotent
  await prisma.webhookEvent.deleteMany({
    where: { accountId: account.id, instagramUserId: { startsWith: 'seed_' } },
  });

  const eventTypes = ['comments', 'mentions'] as const;
  const webhookEventRows: Parameters<typeof prisma.webhookEvent.create>[0]['data'][] = [];

  for (let day = 0; day < 30; day++) {
    const commentCount = randomInt(4, 20);
    const mentionCount = randomInt(1, 6);

    for (let i = 0; i < commentCount; i++) {
      webhookEventRows.push({
        eventType: 'comments',
        instagramUserId: `seed_user_${day}_${i}`,
        accountId: account.id,
        eventHash: buildSeedEventHash(account.id, `comments:${day}:${i}`),
        payload: { from: { id: `seed_user_${day}_${i}`, username: `user_${day}_${i}` }, text: 'Great product!', media: { id: 'media_001' } },
        processed: true,
        processedAt: daysAgo(day, randomInt(0, 23)),
        createdAt: daysAgo(day, randomInt(0, 23)),
      });
    }

    for (let i = 0; i < mentionCount; i++) {
      webhookEventRows.push({
        eventType: 'mentions',
        instagramUserId: `seed_mention_${day}_${i}`,
        accountId: account.id,
        eventHash: buildSeedEventHash(account.id, `mentions:${day}:${i}`),
        payload: { from: { id: `seed_mention_${day}_${i}`, username: `fan_${day}_${i}` }, text: `Love @testbrand!`, media: { id: 'media_002' } },
        processed: true,
        processedAt: daysAgo(day, randomInt(0, 23)),
        createdAt: daysAgo(day, randomInt(0, 23)),
      });
    }
  }

  // Batch insert
  await prisma.$transaction(
    webhookEventRows.map((data) => prisma.webhookEvent.create({ data: data as any }))
  );

  console.log(`✅ ${webhookEventRows.length} webhook events created (last 30 days)`);

  // ── 5. Instagram comments (replied = analytics totalRepliesSent source) ──
  await prisma.instagramComment.deleteMany({
    where: { accountId: account.id, username: { startsWith: 'seed_' } },
  });

  const commentRows: Parameters<typeof prisma.instagramComment.create>[0]['data'][] = [];

  const commentTexts = [
    'What is the price?',
    'Can you help me?',
    'Love this product!',
    'Need more info',
    'How much does it cost?',
    'Thanks so much!',
    'Amazing drop!',
    'Tell me more',
  ];

  for (let day = 0; day < 30; day++) {
    const repliedCount = randomInt(3, 14);
    for (let i = 0; i < repliedCount; i++) {
      const repliedAt = daysAgo(day, randomInt(0, 20));
      commentRows.push({
        commentId: `seed_cmt_${day}_${i}_${Date.now()}_${Math.random()}`,
        accountId: account.id,
        mediaId: 'media_001',
        text: commentTexts[randomInt(0, commentTexts.length - 1)],
        username: `seed_commenter_${day}_${i}`,
        timestamp: daysAgo(day, randomInt(1, 23)),
        isReply: false,
        replied: true,
        replyText: 'Thanks for reaching out! Check your DMs 😊',
        repliedAt,
      });
    }
  }

  await prisma.$transaction(
    commentRows.map((data) => prisma.instagramComment.create({ data: data as any }))
  );

  console.log(`✅ ${commentRows.length} instagram comments created (last 30 days, all replied)`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║           SEED COMPLETE 🎉                ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log('║  Email    : test@example.com             ║');
  console.log('║  Password : password123                  ║');
  console.log(`║  AccountId: ${account.id.padEnd(28)} ║`);
  console.log('╠══════════════════════════════════════════╣');
  console.log('║  Test endpoint:                          ║');
  console.log('║  GET /api/analytics/overview             ║');
  console.log('║    ?accountId=<above>&period=30d         ║');
  console.log('╚══════════════════════════════════════════╝');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
