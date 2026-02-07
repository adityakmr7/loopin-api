#!/bin/sh
set -e

echo "🚀 Starting Loopin API..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  echo "Please set DATABASE_URL in your environment variables."
  exit 1
fi

echo "✅ Database URL configured"

# Run database migrations
echo "📦 Running database migrations..."
bun run db:migrate:deploy

# Start the application
echo "✅ Migrations complete. Starting server..."
exec bun run src/index.ts
