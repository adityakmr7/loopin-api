# Webhook Setup - Quick Fix Guide

## ✅ Problem Solved!

Your webhook is now working correctly!

## What Was Wrong

The error "The callback URL or verify token couldn't be validated" occurred because:
- ❌ `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` was missing from your `.env` file
- ✅ Fixed by adding: `INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing`

## Verification Test

```bash
curl "https://80bdeefb9b24.ngrok-free.app/api/instagram/webhooks?hub.mode=subscribe&hub.verify_token=testing&hub.challenge=test123"
```

**Result:** `test123` ✅ (Correct!)

---

## Now Configure in Meta Dashboard

### Step 1: Enter Webhook Details

**Callback URL:**
```
https://80bdeefb9b24.ngrok-free.app/api/instagram/webhooks
```

**Verify Token:**
```
testing
```

### Step 2: Click "Verify and Save"

Meta will send a GET request to verify your endpoint. It should now succeed!

### Step 3: Subscribe to Fields

After verification, subscribe to the events you want:

- ☑️ **comments** - Get notified of new comments
- ☑️ **mentions** - Get notified when mentioned
- ☑️ **messages** - Get notified of new DMs
- ☑️ **story_insights** - Get story analytics

Click **Subscribe** for each field.

---

## Important Notes

### ngrok URL Changes

⚠️ **Your ngrok URL (`https://80bdeefb9b24.ngrok-free.app`) will change when you restart ngrok!**

**When ngrok restarts:**
1. Get new URL from ngrok terminal
2. Update webhook URL in Meta Dashboard
3. Click "Verify and Save" again

### For Production

When deploying to production:

1. **Update .env:**
   ```env
   # Use a secure random token
   INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your-secure-random-token-here
   ```

2. **Generate secure token:**
   ```bash
   openssl rand -hex 32
   ```

3. **Use your production domain:**
   ```
   https://api.yourdomain.com/api/instagram/webhooks
   ```

---

## Testing Webhooks

### View Incoming Webhooks

Check your server logs to see webhook events:

```bash
# Your server will log:
📩 Instagram webhook received: {
  "object": "instagram",
  "entry": [...]
}
```

### Test with Real Events

1. **Comment Test:**
   - Post a comment on your Instagram post
   - Check server logs for webhook event

2. **Mention Test:**
   - Have someone mention your account
   - Check server logs

3. **DM Test:**
   - Send a DM to your account
   - Check server logs

### Monitor in ngrok

Open ngrok web interface:
```
http://127.0.0.1:4040
```

You'll see all webhook requests in real-time!

---

## Troubleshooting

### Still Getting Validation Error?

1. **Check server is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check ngrok is running:**
   ```bash
   curl https://80bdeefb9b24.ngrok-free.app/health
   ```

3. **Verify token matches:**
   - `.env`: `INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing`
   - Meta Dashboard: `testing`

4. **Test webhook directly:**
   ```bash
   curl "https://YOUR_NGROK_URL/api/instagram/webhooks?hub.mode=subscribe&hub.verify_token=testing&hub.challenge=test"
   ```
   Should return: `test`

### Webhook Not Receiving Events?

1. **Check subscriptions** in Meta Dashboard
2. **Verify app is in Live mode** (or use test users)
3. **Check server logs** for errors
4. **Ensure Instagram account is connected** to your app

---

## Current Configuration

✅ **Server:** Running on port 3000
✅ **ngrok:** Forwarding to localhost:3000  
✅ **Webhook URL:** `https://80bdeefb9b24.ngrok-free.app/api/instagram/webhooks`
✅ **Verify Token:** `testing`
✅ **Status:** Verification working!

---

## Next Steps

1. ✅ Configure webhook in Meta Dashboard (use details above)
2. ✅ Subscribe to webhook fields
3. ✅ Test with real Instagram events
4. 🔄 Implement webhook handlers in code (already set up!)
5. 🚀 Build automation features!

---

## Your Webhook Handler

The webhook handler is already implemented in:
`src/routes/instagram-webhooks.routes.ts`

It currently logs events. You can add automation logic:

```typescript
case 'comments':
  // Auto-reply to comments
  // Moderate spam
  // Notify user
  break;

case 'messages':
  // Auto-reply to DMs
  // Route to support
  break;
```

---

## Summary

✅ **Problem:** Webhook verification failed  
✅ **Cause:** Missing verify token in .env  
✅ **Solution:** Added `INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing`  
✅ **Status:** Webhook now working!  
✅ **Action:** Configure in Meta Dashboard using details above
