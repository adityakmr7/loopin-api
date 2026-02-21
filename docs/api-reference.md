# API Reference

**Base URL:** `http://localhost:3000`  
**Auth:** All protected routes require `Authorization: Bearer <accessToken>` header.

---

## Health

### `GET /health`
Returns API health status.

### `GET /health/db`
Returns database connection status.

---

## Authentication — `/api/auth`

### `POST /api/auth/register`
Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "Jane Doe"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

### `POST /api/auth/login`
Login with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response `200`:** Same shape as register.

---

### `POST /api/auth/refresh`
Exchange a refresh token for a new access token.

**Body:**
```json
{ "refreshToken": "..." }
```

---

### `POST /api/auth/logout`
Invalidate a refresh token (single device).

**Body:**
```json
{ "refreshToken": "..." }
```

---

### `GET /api/auth/me` 🔒
Get the currently authenticated user.

---

## Instagram — `/api/instagram`

### `GET /api/instagram/auth` 🔒
Returns the Instagram OAuth URL to redirect the user to.

### `GET /api/instagram/callback`
OAuth callback — exchanges code for token and stores the connected account.

### `GET /api/instagram/accounts` 🔒
List all Instagram accounts connected to the authenticated user.

### `GET /api/instagram/accounts/:id` 🔒
Get details for a specific connected Instagram account.

### `POST /api/instagram/accounts/:id/refresh` 🔒
Manually refresh the cached profile data (followers, bio, etc.) for an account.

### `POST /api/instagram/accounts/:id/disconnect` 🔒
Disconnect and remove an Instagram account.

---

## Automation Rules — `/api/automation`

### `POST /api/automation/rules` 🔒
Create a new automation rule.

**Body:**
```json
{
  "accountId": "clxx...",
  "name": "Pricing Auto-Reply",
  "description": "Reply when someone asks about price",
  "trigger": "comment",
  "conditions": { "keywords": ["price", "cost", "how much"] },
  "actions": { "reply": "DM us for pricing! 💬", "like": true }
}
```

**Trigger values:** `"comment"` | `"mention"` | `"message"`

---

### `GET /api/automation/rules` 🔒
List all automation rules. Optionally filter by account.

**Query:** `?accountId=clxx...`

---

### `GET /api/automation/rules/:id` 🔒
Get a specific automation rule by ID.

### `PATCH /api/automation/rules/:id` 🔒
Partially update an automation rule. All fields are optional.

### `DELETE /api/automation/rules/:id` 🔒
Delete an automation rule.

---

## Analytics — `/api/analytics`

### `GET /api/analytics/overview` 🔒
Get automation analytics for an Instagram account.

**Query params:**
| Param | Required | Values |
|---|---|---|
| `accountId` | ✅ | Internal account ID |
| `period` | ✅ | `"7d"` \| `"30d"` \| `"90d"` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTriggers": 245,
      "totalReplies": 193,
      "totalLikes": 132,
      "replyRate": 78.8
    },
    "dailyChart": [
      { "date": "2026-02-15", "triggers": 12, "replies": 9, "likes": 6 }
    ],
    "topRules": [
      { "id": "...", "name": "Pricing Auto-Reply", "triggerCount": 120 }
    ],
    "triggerBreakdown": {
      "comment": 180,
      "mention": 65
    }
  }
}
```

---

## Dashboard — `/api/dashboard`

### `GET /api/dashboard` 🔒
Returns a high-level summary for the user's connected accounts and automation activity.

---

## Webhooks — `/api/instagram/webhooks`

### `GET /api/instagram/webhooks`
Meta webhook verification endpoint (hub challenge).

### `POST /api/instagram/webhooks`
Receives and processes real-time Instagram events (comments, mentions, messages).

> ⚠️ This endpoint is called by Meta's servers, not your frontend. It does not require user auth.
