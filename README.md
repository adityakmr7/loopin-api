# Loopin API

A production-ready REST API built with Hono, Prisma, PostgreSQL, and JWT authentication. Designed for scalability, security, and developer experience.

## 🚀 Features

- ✅ **JWT Authentication** - Secure user authentication with access and refresh tokens
- ✅ **PostgreSQL Database** - Robust relational database with Prisma ORM
- ✅ **Docker Support** - Containerized setup for easy deployment
- ✅ **Type Safety** - Full TypeScript support with strict type checking
- ✅ **Input Validation** - Request validation using Zod schemas
- ✅ **Rate Limiting** - API protection against abuse
- ✅ **Security Headers** - CORS, secure headers, and best practices
- ✅ **Error Handling** - Comprehensive error handling middleware
- ✅ **Database Migrations** - Version-controlled schema changes with Prisma
- ✅ **Hot Reload** - Fast development with Bun's hot reload

## 📋 Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Docker](https://www.docker.com/) and Docker Compose
- [PostgreSQL](https://www.postgresql.org/) (via Docker or local installation)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd loopin-api
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and update the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://loopin:loopin_password@localhost:5432/loopin_db"

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
PORT=3000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

> ⚠️ **IMPORTANT**: Generate strong, random secrets for production using:
> ```bash
> openssl rand -base64 32
> ```

### 4. Start PostgreSQL with Docker

```bash
bun run docker:up
```

This will start a PostgreSQL container with the configuration from `docker-compose.yml`.

### 5. Run database migrations

```bash
bun run db:migrate
```

### 6. Seed the database (optional)

```bash
bun run db:seed
```

This creates a test user:
- Email: `test@example.com`
- Password: `password123`

### 7. Start the development server

```bash
bun run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL

```
http://localhost:3000
```

### Endpoints

#### Health Check

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-15T04:50:53.015Z"
  }
}
```

**GET** `/health/db`

Check database connectivity.

---

#### Authentication

**POST** `/api/auth/register`

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci..."
    }
  }
}
```

---

**POST** `/api/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci..."
    }
  }
}
```

---

**POST** `/api/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

---

**POST** `/api/auth/logout`

Logout user and invalidate refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

---

**GET** `/api/auth/me` 🔒

Get current user information (protected route).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## 🔐 Authentication Flow

1. **Register** or **Login** to get access and refresh tokens
2. **Use access token** in `Authorization: Bearer <token>` header for protected routes
3. **Refresh token** when access token expires (15 minutes by default)
4. **Logout** to invalidate refresh token

## 🐳 Docker Commands

```bash
# Start all services
bun run docker:up

# Stop all services
bun run docker:down

# View logs
bun run docker:logs

# Start only PostgreSQL
docker-compose up -d postgres
```

## 🗄️ Database Commands

```bash
# Generate Prisma Client
bun run db:generate

# Create and apply migration
bun run db:migrate

# Deploy migrations (production)
bun run db:migrate:deploy

# Open Prisma Studio (database GUI)
bun run db:studio

# Seed database
bun run db:seed
```

## 📁 Project Structure

```
loopin-api/
├── prisma/
│   ├── migrations/          # Database migrations
│   ├── schema.prisma        # Database schema
│   └── seed.ts             # Database seeding script
├── src/
│   ├── config/
│   │   ├── database.ts     # Prisma client configuration
│   │   └── env.ts          # Environment validation
│   ├── lib/
│   │   └── auth.ts         # Authentication utilities
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT authentication
│   │   ├── error.middleware.ts      # Error handling
│   │   └── rate-limit.middleware.ts # Rate limiting
│   ├── routes/
│   │   ├── auth.routes.ts  # Authentication endpoints
│   │   └── health.routes.ts # Health check endpoints
│   ├── services/
│   │   ├── auth.service.ts # Authentication business logic
│   │   └── user.service.ts # User operations
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   ├── validators/
│   │   └── auth.validator.ts # Request validation schemas
│   └── index.ts            # Application entry point
├── .env                    # Environment variables (not in git)
├── .env.example           # Environment template
├── docker-compose.yml     # Docker services configuration
├── Dockerfile             # API container configuration
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## 🔒 Security Best Practices

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with short expiration times
- ✅ Refresh token rotation on use
- ✅ SQL injection protection via Prisma
- ✅ Input validation with Zod
- ✅ Rate limiting to prevent abuse
- ✅ CORS configuration
- ✅ Security headers (helmet)
- ✅ Environment variable validation

## 🚀 Deployment

### Production Environment Variables

Ensure you set strong, unique values for:

```env
NODE_ENV=production
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
DATABASE_URL=<your-production-database-url>
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# Run migrations
docker-compose exec api bun run db:migrate:deploy
```

### Manual Deployment

```bash
# Install dependencies
bun install --production

# Generate Prisma Client
bun run db:generate

# Run migrations
bun run db:migrate:deploy

# Start server
bun run start
```

## 🧪 Testing the API

### Using cURL

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current user (replace TOKEN with your access token)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

Import the following as a Postman collection or use the endpoints documented above.

## 🛠️ Development

### Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run db:generate` - Generate Prisma Client
- `bun run db:migrate` - Create and apply migration
- `bun run db:studio` - Open Prisma Studio
- `bun run db:seed` - Seed database
- `bun run docker:up` - Start Docker services
- `bun run docker:down` - Stop Docker services

### Adding New Routes

1. Create route handler in `src/routes/`
2. Create service in `src/services/`
3. Create validator in `src/validators/`
4. Register route in `src/index.ts`

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.
