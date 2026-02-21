# Changelog

All notable changes to Loopin API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

> Features planned for the next release. See [roadmap.md](./roadmap.md) for full details.

### Planned
- `UserSettings` model for timezone, notification preferences, and safety limits
- Blacklisted keywords and ignored usernames per account
- Max replies per hour rate limiter
- Instagram token expiry email alerts
- Comment → DM automation action type

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
- Flexible `conditions` (keyword matching) and `actions` (reply, like) as JSON
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
