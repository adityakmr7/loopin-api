# Changelog

All notable changes to Loopin API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

> Features planned for the next release. See [roadmap.md](./roadmap.md) for full details.

### Added
- Queue infrastructure scaffold (Redis + BullMQ) for async webhook processing
- Redis configuration wiring (`REDIS_URL`) and queue setup module
- Webhook worker process for queued event handling
- Webhook enqueueing in `/api/instagram/webhooks` (async ingestion)
- Local Redis service in `docker-compose.yml`
- Webhook signature verification (HMAC SHA-256 / SHA-1 fallback) for POST events in all environments
- Webhook idempotency via deterministic `eventHash` on `WebhookEvent`
- Redis-backed rate guards for replies and DMs
- Distributed Redis locks for cron jobs (`token-refresh`, `snapshot`, `token-expiry-alert`)
- Dead-letter queue routing and logging for webhook jobs that exhaust retry attempts
- Configurable webhook processing mode (`queue` or `inline`) for MVP deployments without workers
- Rate guard backend modes (`redis`, `memory`, `auto`) with automatic memory fallback when Redis is unavailable

### Planned
- Automation rule templates library (`AutomationTemplate` model)
- Story mention/reply trigger
- Welcome DM for new followers

---

## [1.2.0] — 2026-02-21

### Added

#### 💬 Comment → DM Automation
- `comment_to_dm` action type on `AutomationRule.actions` — send a private DM when a user comments
- `dm.service.ts` — `sendDM()` calls Instagram Graph API `POST /me/messages`; `sendCommentToDM()` orchestrates send + DB update
- DM tracking fields on `InstagramComment`: `dmSent`, `dmText`, `dmSentAt`, `dmError`
- Per-account DM rate guard — enforces Meta's ~200 DM/hour limit (in-memory, same pattern as reply guard)
- `dmCount` stat field added to `AutomationRule` for analytics
- `comment_to_dm` is composable — can be combined with `reply`, `like`, `hide` in the same action object
- `actions` Zod schema now typed (replaces `z.any()`) — validates all action fields and requires at least one

#### 📊 Dashboard Enhancement
- `recentInteractions` now includes a `dm` field: `{ sent, text, sentAt }` per comment

## [1.1.0] — 2026-02-21

### Added

#### ⚙️ User Settings
- `UserSettings` model (1-to-1 with `User`) with full cascade delete
- `GET /api/settings` 🔒 — returns settings, auto-creates defaults on first call
- `PATCH /api/settings` 🔒 — partial update with Zod validation
- Fields: `timezone`, `maxRepliesPerHour`, `replyDelayMinSecs`, `replyDelayMaxSecs`, `blockedKeywords`, `ignoredUsernames`, `notifyOnTokenExpiry`, `notifyOnRuleFailure`

#### 🛡️ Safety Enforcement
- **Blocked keywords** — automation skips entirely if comment text contains any keyword in `blockedKeywords`
- **Ignored usernames** — automation skips entirely if commenter is in `ignoredUsernames`
- **Human-like reply delay** — random sleep between `replyDelayMinSecs` and `replyDelayMaxSecs` before any action fires
- **Per-account rate guard** — in-memory hourly counter prevents exceeding `maxRepliesPerHour`; resets automatically each hour

#### 🔔 Token Expiry Alerts
- `token-expiry-alert.job.ts` — daily cron (9 AM) checks tokens expiring within 7 days
- `notification.service.ts` — structured notification layer (console now, email-ready)
- Respects `notifyOnTokenExpiry` user preference

#### 🔐 Session Management
- `GET /api/auth/sessions` 🔒 — list all active (non-expired) refresh tokens
- `DELETE /api/auth/sessions` 🔒 — revoke all sessions (logout all devices)
- `DELETE /api/auth/sessions/:id` 🔒 — revoke a single session by token ID

---

## [1.0.0] — 2026-02-21

> Initial production-ready release of the Loopin API.

### Added

#### 🔐 Authentication
- `POST /api/auth/register` — User registration with bcrypt-hashed password
- `POST /api/auth/login` — Email/password login returning JWT access + refresh tokens
- `POST /api/auth/refresh` — Access token refresh using a valid refresh token
- `POST /api/auth/logout` — Single-device logout (revokes refresh token)
- `GET /api/auth/me` — Authenticated user profile
- `logoutAll()` service function for revoking all sessions (not yet exposed as a route)
- JWT access tokens (15m expiry) + refresh tokens (7d expiry, stored in DB)

#### 📱 Instagram Account Management
- `GET /api/instagram/auth` — Generate Instagram OAuth URL
- `GET /api/instagram/callback` — OAuth code exchange and account creation
- `GET /api/instagram/accounts` — List connected accounts
- `GET /api/instagram/accounts/:id` — Account detail view
- `POST /api/instagram/accounts/:id/refresh` — Refresh cached profile data
- `POST /api/instagram/accounts/:id/disconnect` — Disconnect an account
- `instagramBusinessAccountId` field added for accurate webhook matching

#### 🤖 Automation Rules
- `POST /api/automation/rules` — Create a rule with trigger, conditions, and actions
- `GET /api/automation/rules` — List rules with optional account filter
- `GET /api/automation/rules/:id` — Get specific rule
- `PATCH /api/automation/rules/:id` — Partial update (all fields optional)
- `DELETE /api/automation/rules/:id` — Delete rule
- Supported triggers: `"comment"`, `"mention"`, `"message"`
- Flexible `conditions` (keyword matching) and `actions` (reply, like, **hide**) as JSON
- `actions.hide: true` hides a comment via Instagram Graph API
- `triggerCount`, `replyCount`, `likeCount` counters per rule
- `lastTriggered` timestamp tracking

#### 🪝 Webhook Processing
- `GET /api/instagram/webhooks` — Meta webhook hub verification
- `POST /api/instagram/webhooks` — Real-time event ingestion
- Automatic rule matching on incoming comment/mention events
- `rule-matcher.service.ts` — Keyword-based condition evaluation
- `action-executor.service.ts` — Reply-to-comment and like-comment actions
- `WebhookEvent` persisted to database with processed status

#### 📊 Analytics
- `GET /api/analytics/overview` — Analytics for a given account + period (`7d`, `30d`, `90d`)
- Summary: total triggers, replies, likes, reply rate percentage
- Daily chart data (per-day breakdown over period)
- Top automation rules by trigger count
- Trigger type breakdown (comment vs. mention)
- `replyCount` and `likeCount` fields added to `AutomationRule`

#### 📈 Dashboard
- `GET /api/dashboard` — High-level summary across all connected accounts

#### ⏰ Background Jobs
- `token-refresh.job` — Daily cron to refresh Instagram long-lived tokens before expiry
- `snapshot.job` — Daily cron to capture `InstagramAccountSnapshot` (followers, following, media count)

#### 🗄️ Database Schema
- Models: `User`, `RefreshToken`, `InstagramAccount`, `InstagramToken`, `InstagramAccountSnapshot`, `AutomationRule`, `WebhookEvent`, `InstagramComment`
- All relationships with cascading deletes
- Indexes on all foreign keys and frequently queried fields

#### 🛡️ Infrastructure
- Hono + Bun runtime
- Global middleware: `logger`, `secureHeaders`, `cors`, `errorMiddleware`, `rateLimitMiddleware`
- `authMiddleware` for JWT validation on protected routes
- Zod v4 request validation on all routes
- PostgreSQL via Prisma ORM with `@prisma/adapter-pg`
- Development seed script (`prisma/seed.ts`) for local testing

---

## Version History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-02-21 | Initial release — auth, Instagram connection, automation engine, analytics, webhooks |
