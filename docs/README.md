# Loopin API — Documentation

> Instagram Automation SaaS — REST API built with Hono + Bun + Prisma + PostgreSQL

---

## 📚 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](./getting-started.md)
- [API Reference](./api-reference.md)
- [Architecture](./architecture.md)
- [Roadmap](./roadmap.md)
- [Changelog](./CHANGELOG.md)

---

## Overview

**Loopin** is an Instagram automation platform that allows businesses to automate interactions on their Instagram accounts — including auto-replying to comments, handling mentions, DMs, and tracking engagement analytics.

### Core Capabilities (v1.0.0)

| Feature | Status |
|---|---|
| User authentication (JWT + refresh tokens) | ✅ Live |
| Instagram OAuth account connection | ✅ Live |
| Automation rule engine (comment / mention / message triggers) | ✅ Live |
| Webhook processing (real-time Instagram events) | ✅ Live |
| Analytics overview (triggers, replies, likes, chart data) | ✅ Live |
| Dashboard summary | ✅ Live |
| Instagram account snapshots (follower growth tracking) | ✅ Live |
| Instagram token auto-refresh (background job) | ✅ Live |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Hono](https://hono.dev) |
| Database | PostgreSQL |
| ORM | [Prisma](https://www.prisma.io) |
| Validation | [Zod v4](https://zod.dev) |
| Auth | JWT (access + refresh token pattern) |
| Background Jobs | node-cron |
| Rate Limiting | hono-rate-limiter |

---

## Project Structure

```
loopin-api/
├── src/
│   ├── config/          # Env config, database client
│   ├── jobs/            # Background cron jobs
│   ├── middleware/       # Auth, error, rate-limit middleware
│   ├── routes/          # Route handlers
│   ├── services/        # Business logic
│   ├── types/           # Shared TypeScript types
│   ├── validators/      # Zod schemas
│   └── index.ts         # App entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Migration history
│   └── seed.ts          # Dev seed data
└── docs/                # This directory
```
