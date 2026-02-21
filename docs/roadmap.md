# Product Roadmap

> Based on market research of leading Instagram automation tools (ManyChat, Inrō, LinkDM, Instant DM, ReplyRush) and 2025 industry trends.

---

## ✅ v1.0.0 — Foundation (Shipped)

- User authentication (register, login, refresh, logout)
- Instagram OAuth account connection (Business/Creator accounts)
- Automation rule engine: comment, mention, message triggers
- Keyword-based condition matching
- Reply-to-comment and auto-like actions
- Real-time webhook processing (Meta Graph API)
- Analytics overview (triggers, replies, likes, daily chart, top rules)
- Dashboard summary
- Instagram account snapshots (follower growth)
- Instagram token auto-refresh job
- Rate limiting, secure headers, CORS

---

## 🔄 v1.1.0 — Safety & Settings *(Next)*

**Goal:** Protect users from Instagram bans and improve personalization.

- [ ] `UserSettings` model — timezone, notification prefs, safety limits
- [ ] Blacklisted keywords (never trigger automation on these)
- [ ] Ignored usernames (skip automation for specific accounts)
- [ ] Max replies per hour rate limiter (per account)
- [ ] Human-like reply delay (configurable 5–60s range)
- [ ] Instagram token expiry email warning (cron alert)
- [ ] Active session management (view + revoke all refresh tokens)

---

## 🚀 v1.2.0 — Comment → DM Automation

**Goal:** The #1 high-conversion feature used by ManyChat & Inrō.

- [ ] `comment_to_dm` action type in `AutomationRule.actions`
- [ ] Send direct DM when a user comments on a post
- [ ] Configurable DM message template per rule
- [ ] Rate-limit DM sends to respect Meta's ~200 DM/hour limit
- [ ] Track DM sent status in `WebhookEvent` / `InstagramComment`

---

## 📦 v1.3.0 — Templates & Onboarding

**Goal:** Reduce time-to-value for new users.

- [ ] `AutomationTemplate` model (pre-built rules, not account-bound)
- [ ] Default template library: Pricing FAQ, Giveaway, Support Triage, Thank You
- [ ] "Use Template" flow to create a rule from a template
- [ ] Story mention/reply trigger support
- [ ] Welcome DM for new followers

---

## 🤝 v1.4.0 — Unified Inbox

**Goal:** Give users a single place to manage all interactions.

- [ ] Fetch and store DM threads per account
- [ ] View all comments + DMs in one dashboard
- [ ] Human takeover: pause automation on a specific conversation
- [ ] Mark conversation as resolved
- [ ] Internal notes per conversation thread

---

## 🤖 v2.0.0 — AI-Powered Automation

**Goal:** Differentiate from rule-based competitors.

- [ ] AI reply suggestions (GPT integration: feed comment → suggest reply)
- [ ] Sentiment analysis — negative sentiment → skip auto-reply, flag for human
- [ ] Personalization tokens: `{{first_name}}` in reply templates
- [ ] A/B testing for automation rules (test 2 reply variants, auto-pick winner)
- [ ] Smart reply scheduling (randomize delay to appear human)

---

## 💳 v2.1.0 — Billing & Teams

**Goal:** Monetize and support agency use cases.

- [ ] Subscription tiers (gate by accounts, rules, monthly reply volume)
- [ ] Stripe integration
- [ ] Team members / workspace model
- [ ] Role-based permissions (Admin, Member, Viewer)

---

## 🔗 v2.2.0 — Integrations

**Goal:** Connect Loopin to the tools users already use.

- [ ] Zapier / Make (Integromat) webhook output
- [ ] Lead export to Google Sheets
- [ ] HubSpot / Notion CRM integration
- [ ] Email drip sequences triggered by DM interactions

---

## 🌐 v3.0.0 — Platform Expansion

- [ ] Facebook Messenger automation (same Meta API)
- [ ] Multi-language automation rules
- [ ] Mobile app (on-the-go monitoring)
- [ ] Integrations marketplace for third-party connectors
