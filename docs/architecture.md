# Architecture

## System Overview

```
Frontend (Next.js / Mobile)
        │
        ▼
   Loopin API (Hono + Bun)
        │
        ├─── PostgreSQL (via Prisma ORM)
        │
        └─── Instagram Graph API (Meta)
                    ▲
                    │ (Webhooks push events)
              Meta Servers
```

---

## Request Flow

### Authentication Flow
```
Client ──POST /api/auth/login──► Auth Route
                                    │
                                    ▼
                            auth.service.ts
                            - Validate credentials
                            - Issue accessToken (15m)
                            - Issue refreshToken (7d, stored in DB)
                                    │
                                    ▼
                            Response: { accessToken, refreshToken }
```

### Webhook → Automation Flow
```
Instagram ──POST /api/instagram/webhooks──► Webhook Handler
                                                │
                                                ▼
                                        Store WebhookEvent
                                                │
                                                ▼
                                    automation.service.ts
                                    - Find matching rules by trigger type
                                    - Match conditions (keywords)
                                                │
                                                ▼
                                    rule-matcher.service.ts
                                    - Verify keyword match
                                                │
                                                ▼
                                    action-executor.service.ts
                                    - Reply to comment
                                    - Like comment
                                    - Send DM
                                                │
                                                ▼
                                    Increment rule counters
                                    (triggerCount, replyCount, likeCount)
```

---

## Database Models

| Model | Purpose |
|---|---|
| `User` | Platform user account |
| `RefreshToken` | JWT refresh tokens for session management |
| `InstagramAccount` | Connected Instagram Business/Creator account |
| `InstagramToken` | OAuth access tokens for Instagram API calls |
| `InstagramAccountSnapshot` | Daily follower/media count snapshot for growth tracking |
| `AutomationRule` | User-defined trigger → condition → action rules |
| `WebhookEvent` | Raw incoming webhook events from Meta |
| `InstagramComment` | Processed comments, including reply tracking |

---

## Background Jobs

| Job | Schedule | Purpose |
|---|---|---|
| `token-refresh.job` | Daily | Refresh Instagram long-lived tokens before expiry |
| `snapshot.job` | Daily | Capture follower/media count snapshots per account |

---

## Middleware Stack

All requests pass through (in order):

1. `logger` — Request/response logging
2. `secureHeaders` — Security headers (XSS, HSTS, etc.)
3. `cors` — Configurable CORS origins
4. `errorMiddleware` — Global error handler
5. `rateLimitMiddleware` — Per-IP rate limiting

Protected routes additionally use:

6. `authMiddleware` — Validates Bearer JWT, injects `user` into context
