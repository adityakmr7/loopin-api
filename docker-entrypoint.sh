#!/bin/sh
set -e

echo "🚀 Starting Loopin API..."

# Run database migrations
echo "📦 Running database migrations..."
bun run db:migrate:deploy

# Start the application
echo "✅ Migrations complete. Starting server..."
exec bun run src/index.ts
