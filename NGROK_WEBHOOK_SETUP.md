# ngrok Setup Guide for Instagram Webhooks

## What are Webhooks?

Webhooks allow Instagram to send real-time notifications to your app when events occur:
- New comments on posts
- New mentions
- New direct messages
- Story insights updates

Instead of constantly polling Instagram's API, webhooks push updates to your server instantly.

## Why ngrok for Local Development?

Instagram webhooks require a **publicly accessible HTTPS URL**. Your local server (`localhost:3000`) isn't accessible from the internet, so ngrok creates a secure tunnel:

```
Instagram → ngrok (public URL) → Your Local Server (localhost:3000)
```

---

## Step-by-Step Setup

### 1. Install ngrok

**Mac (using Homebrew):**
```bash
brew install ngrok/ngrok/ngrok
```

**Mac/Linux (using curl):**
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && sudo apt install ngrok
```

**Manual Download:**
- Visit [ngrok.com/download](https://ngrok.com/download)
- Download for your OS
- Unzip and move to `/usr/local/bin/`

### 2. Create Free ngrok Account

1. Go to [ngrok.com](https://ngrok.com)
2. Sign up (free tier is sufficient)
3. Verify your email

### 3. Get Your Auth Token

1. Log in to [dashboard.ngrok.com](https://dashboard.ngrok.com)
2. Go to "Your Authtoken" or [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Copy your authtoken (looks like: `2abc123def456ghi789jkl012mno345_6pqr789stu012vwx345yz`)

### 4. Configure ngrok

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

This saves your token to `~/.ngrok2/ngrok.yml`

### 5. Generate Webhook Verify Token

```bash
openssl rand -hex 32
```

Copy the output and add to your `.env`:

```env
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=<paste-the-generated-token-here>
```

### 6. Start Your API Server

In one terminal:
```bash
cd /Users/adityakumar/Desktop/projects/sass-loopin/loopin-api
bun run dev
```

### 7. Start ngrok Tunnel

In a **new terminal window**:
```bash
ngrok http 3000
```

You'll see:
```
ngrok

Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Important**: Copy the `https://abc123.ngrok-free.app` URL!

### 8. Update Your .env

Update your `.env` with the ngrok URL:

```env
# Replace with your ngrok URL
INSTAGRAM_REDIRECT_URI=https://abc123.ngrok-free.app/api/instagram/callback
```

**Note**: The ngrok URL changes every time you restart ngrok (on free plan). You'll need to update this each time.

---

## Configure Instagram Webhooks in Meta Dashboard

### Step 1: Go to Webhook Configuration

1. Open [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Select your app
3. Go to **Products** → **Webhooks**
4. Click **Configure Webhooks** or **Edit Subscription**

### Step 2: Add Callback URL

**Callback URL:**
```
https://abc123.ngrok-free.app/api/instagram/webhooks
```
(Replace `abc123` with your actual ngrok subdomain)

**Verify Token:**
```
<paste-your-INSTAGRAM_WEBHOOK_VERIFY_TOKEN-here>
```

### Step 3: Verify and Save

1. Click **Verify and Save**
2. Instagram will send a GET request to verify your endpoint
3. You should see "✅ Webhook verified" in your API logs

### Step 4: Subscribe to Fields

Select which events you want to receive:
- ☑️ **comments** - New comments on posts
- ☑️ **mentions** - When your account is mentioned
- ☑️ **messages** - New direct messages
- ☑️ **story_insights** - Story analytics

Click **Subscribe** for each field you want.

---

## Testing Webhooks

### 1. Monitor ngrok Traffic

Open the ngrok web interface in your browser:
```
http://127.0.0.1:4040
```

This shows all HTTP requests going through ngrok in real-time.

### 2. Test Webhook Delivery

**Manual Test:**
1. Post a comment on one of your Instagram posts
2. Check your API logs for webhook event
3. Check ngrok interface for the POST request

**Expected Log Output:**
```
📩 Instagram webhook received: {
  "object": "instagram",
  "entry": [{
    "id": "instagram-account-id",
    "time": 1234567890,
    "changes": [{
      "field": "comments",
      "value": {
        "id": "comment-id",
        "text": "Test comment",
        ...
      }
    }]
  }]
}
```

### 3. Verify in Meta Dashboard

Go to **Webhooks** → **Test** to send test events.

---

## Common Issues & Solutions

### Issue 1: ngrok URL Changes Every Restart

**Problem:** Free ngrok URLs are temporary

**Solutions:**
- **Option A (Free):** Update `.env` and Meta Dashboard each time
- **Option B (Paid):** Upgrade to ngrok Pro for static domains ($8/month)
- **Option C (Alternative):** Use [localhost.run](https://localhost.run) or [serveo.net](https://serveo.net)

### Issue 2: "Webhook verification failed"

**Check:**
1. Verify token in `.env` matches Meta Dashboard exactly
2. ngrok is running and forwarding to port 3000
3. API server is running
4. Check API logs for errors

**Debug:**
```bash
# Test webhook endpoint directly
curl "https://abc123.ngrok-free.app/api/instagram/webhooks?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Should return: test123
```

### Issue 3: "Connection refused"

**Check:**
1. API server is running on port 3000
2. ngrok is forwarding to correct port
3. No firewall blocking connections

### Issue 4: Webhooks not receiving events

**Check:**
1. Subscribed to correct fields in Meta Dashboard
2. Instagram account is connected
3. Test with actual Instagram actions (comment, mention, etc.)
4. Check ngrok interface for incoming requests

---

## Production Deployment

For production, you don't need ngrok. Use your actual domain:

### 1. Deploy to Production Server

```env
# Production .env
INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/instagram/callback
```

### 2. Update Meta Dashboard

1. Add production domain to **App Domains**
2. Update **OAuth Redirect URIs**
3. Update **Webhook Callback URL**

### 3. SSL Certificate

Ensure your production server has valid HTTPS (Let's Encrypt, Cloudflare, etc.)

---

## Webhook Event Types

### Comments
```json
{
  "field": "comments",
  "value": {
    "id": "comment-id",
    "text": "Great post!",
    "from": {
      "id": "user-id",
      "username": "johndoe"
    },
    "media": {
      "id": "media-id",
      "media_product_type": "FEED"
    }
  }
}
```

**Use Cases:**
- Auto-reply to comments
- Moderate spam
- Track engagement

### Mentions
```json
{
  "field": "mentions",
  "value": {
    "comment_id": "comment-id",
    "media_id": "media-id",
    "text": "@yourhandle check this out!"
  }
}
```

**Use Cases:**
- Track brand mentions
- Respond to tags
- Monitor conversations

### Messages (DMs)
```json
{
  "field": "messages",
  "value": {
    "from": {
      "id": "user-id",
      "username": "customer123"
    },
    "message": "Hi, I have a question..."
  }
}
```

**Use Cases:**
- Auto-reply to FAQs
- Route to support team
- Track customer inquiries

---

## Next Steps

1. ✅ Install and configure ngrok
2. ✅ Start ngrok tunnel
3. ✅ Update .env with ngrok URL
4. ✅ Configure webhooks in Meta Dashboard
5. ✅ Subscribe to webhook fields
6. ✅ Test webhook delivery
7. 🔄 Implement webhook handlers in code

---

## Useful Commands

```bash
# Start ngrok
ngrok http 3000

# Start ngrok with custom subdomain (Pro plan)
ngrok http 3000 --subdomain=myapp

# View ngrok config
ngrok config check

# View ngrok logs
ngrok http 3000 --log=stdout

# Test webhook endpoint
curl -X GET "http://localhost:3000/api/instagram/webhooks?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
```

---

## Resources

- [ngrok Documentation](https://ngrok.com/docs)
- [Instagram Webhooks Guide](https://developers.facebook.com/docs/instagram-api/guides/webhooks)
- [Meta Webhooks Reference](https://developers.facebook.com/docs/graph-api/webhooks)
