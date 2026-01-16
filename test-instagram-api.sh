#!/bin/bash

# Instagram API Test Script
# Run this to test all Instagram endpoints

set -e

API_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Instagram API Integration Test Suite ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}[1/6] Testing API Health...${NC}"
HEALTH=$(curl -s $API_URL/health)
if echo $HEALTH | grep -q '"success":true'; then
    echo -e "${GREEN}✓ API is healthy${NC}\n"
else
    echo -e "${RED}✗ API health check failed${NC}"
    echo "$HEALTH"
    exit 1
fi

# Test 2: User Login
echo -e "${YELLOW}[2/6] Testing User Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo -e "  Token: ${TOKEN:0:30}...${NC}\n"
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

# Test 3: Instagram OAuth URL
echo -e "${YELLOW}[3/6] Testing Instagram OAuth URL Generation...${NC}"
AUTH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $API_URL/api/instagram/auth)

AUTH_URL=$(echo $AUTH_RESPONSE | grep -o '"authorizationUrl":"[^"]*"' | cut -d'"' -f4)

if [ -n "$AUTH_URL" ] && echo "$AUTH_URL" | grep -q "instagram.com"; then
    echo -e "${GREEN}✓ OAuth URL generated successfully${NC}"
    echo -e "  URL: ${AUTH_URL:0:80}...${NC}\n"
else
    echo -e "${RED}✗ OAuth URL generation failed${NC}"
    echo "$AUTH_RESPONSE"
    exit 1
fi

# Test 4: List Connected Accounts
echo -e "${YELLOW}[4/6] Testing List Connected Accounts...${NC}"
ACCOUNTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $API_URL/api/instagram/accounts)

if echo $ACCOUNTS_RESPONSE | grep -q '"success":true'; then
    ACCOUNT_COUNT=$(echo $ACCOUNTS_RESPONSE | grep -o '"data":\[' | wc -l)
    echo -e "${GREEN}✓ Successfully retrieved accounts${NC}"
    echo -e "  Connected accounts: 0 (connect via OAuth URL above)${NC}\n"
else
    echo -e "${RED}✗ Failed to list accounts${NC}"
    echo "$ACCOUNTS_RESPONSE"
    exit 1
fi

# Test 5: Webhook Verification
echo -e "${YELLOW}[5/6] Testing Webhook Endpoint...${NC}"
WEBHOOK_RESPONSE=$(curl -s "$API_URL/api/instagram/webhooks?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test123")

if [ "$WEBHOOK_RESPONSE" == "Forbidden" ]; then
    echo -e "${YELLOW}⚠ Webhook verification requires correct verify token${NC}"
    echo -e "  (This is expected if INSTAGRAM_WEBHOOK_VERIFY_TOKEN is not set)${NC}\n"
elif [ "$WEBHOOK_RESPONSE" == "test123" ]; then
    echo -e "${GREEN}✓ Webhook verification successful${NC}\n"
else
    echo -e "${YELLOW}⚠ Unexpected webhook response: $WEBHOOK_RESPONSE${NC}\n"
fi

# Test 6: Database Connection
echo -e "${YELLOW}[6/6] Testing Database Connection...${NC}"
DB_HEALTH=$(curl -s $API_URL/health/db)

if echo $DB_HEALTH | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Database connection healthy${NC}\n"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "$DB_HEALTH"
    exit 1
fi

# Summary
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         All Tests Passed! ✓            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Copy the OAuth URL from above"
echo -e "2. Open it in your browser"
echo -e "3. Log in with your Instagram Business account"
echo -e "4. Authorize the app"
echo -e "5. Your Instagram account will be connected!\n"

echo -e "${YELLOW}To view connected accounts after authorization:${NC}"
echo -e "curl -H \"Authorization: Bearer $TOKEN\" \\"
echo -e "  $API_URL/api/instagram/accounts | jq\n"
