# Getting Started

## Prerequisites

- [Bun](https://bun.sh) >= 1.0
- PostgreSQL >= 14
- Meta Developer App with Instagram permissions

---

## Local Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/loopin

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

INSTAGRAM_APP_ID=your_meta_app_id
INSTAGRAM_APP_SECRET=your_meta_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/instagram/callback

APP_URL=http://localhost:3000
PORT=3000
NODE_ENV=development

CORS_ORIGINS=http://localhost:3001
```

### 3. Run database migrations

```bash
bun run db:migrate
```

### 4. (Optional) Seed development data

```bash
bun run db:seed
```

> ⚠️ The seed creates fake test data and should **never** be run in production.

### 5. Start the dev server

```bash
bun run dev
```

The API will be available at `http://localhost:3000`.

---

## Docker (Alternative)

```bash
bun run docker:up     # Start PostgreSQL via docker-compose
bun run docker:down   # Stop containers
bun run docker:logs   # Tail logs
```

---

## Useful Commands

| Command | Description |
|---|---|
| `bun run dev` | Start dev server with hot reload |
| `bun run start` | Start production server |
| `bun run db:migrate` | Run pending migrations (dev) |
| `bun run db:migrate:deploy` | Run migrations (production) |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run db:studio` | Open Prisma Studio UI |
| `bun run db:seed` | Seed dev database |
