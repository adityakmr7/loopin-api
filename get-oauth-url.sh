#!/bin/bash

# Instagram OAuth Test Script
# This will help you authorize with the correct permissions

set -e

API_URL="http://localhost:3000"

echo "╔════════════════════════════════════════╗"
echo "║  Instagram OAuth Authorization Helper ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Step 1: Login
echo "📝 Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed!"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Step 2: Get OAuth URL
echo "📝 Step 2: Getting OAuth URL..."
AUTH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $API_URL/api/instagram/auth)

AUTH_URL=$(echo $AUTH_RESPONSE | grep -o '"authorizationUrl":"[^"]*"' | sed 's/"authorizationUrl":"//;s/"//' | sed 's/\\u0026/\&/g')

if [ -z "$AUTH_URL" ]; then
    echo "❌ Failed to get OAuth URL!"
    echo "$AUTH_RESPONSE"
    exit 1
fi

echo "✅ OAuth URL generated"
echo ""

# Step 3: Display URL and instructions
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    AUTHORIZATION REQUIRED                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🔗 Open this URL in your browser:"
echo ""
echo "$AUTH_URL"
echo ""
echo "⚠️  IMPORTANT: When authorizing, make sure you see and approve:"
echo "   ✅ Instagram Basic"
echo "   ✅ Pages Show List"
echo "   ✅ Pages Manage Metadata  ← THIS IS NEW!"
echo ""
echo "📋 Checklist before authorizing:"
echo "   [ ] Instagram account is Business or Creator (not Personal)"
echo "   [ ] Facebook Page created"
echo "   [ ] Instagram linked to Facebook Page"
echo "   [ ] Ready to approve ALL three permissions above"
echo ""
echo "After authorizing, you'll be redirected to the callback."
echo "Check your server logs for the result!"
echo ""
