# Pixi Bot ↔ Backend Integration Guide

> Complete documentation for connecting the Pixi WhatsApp bot to the Lovable Cloud backend.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Base URL & Authentication](#base-url--authentication)
3. [Edge Functions Reference](#edge-functions-reference)
   - [pixi-whatsapp](#1-pixi-whatsapp) — WhatsApp webhook
   - [pixi-handoff](#2-pixi-handoff) — Token generation
   - [pixi-video-complete](#3-pixi-video-complete) — Video completion callback
   - [pixi-classify](#4-pixi-classify) — AI video classification
   - [pixi-referral](#5-pixi-referral) — Referral system
   - [sumit-payment](#6-sumit-payment) — Payment processing
   - [pixi-admin](#7-pixi-admin) — Admin operations
4. [Database Schema](#database-schema)
5. [Secrets & Environment Variables](#secrets--environment-variables)
6. [User Flow Diagrams](#user-flow-diagrams)
7. [WhatsApp Message Formats](#whatsapp-message-formats)
8. [OpenClaw Bridge](#openclaw-bridge)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

---

## Architecture Overview

```
┌──────────────┐      ┌───────────────────┐      ┌──────────────┐
│  WhatsApp    │─────▶│  pixi-whatsapp    │─────▶│  OpenClaw    │
│  Business    │◀─────│  (Edge Function)  │◀─────│  (Your VPS)  │
│  API         │      └───────────────────┘      └──────────────┘
└──────────────┘              │
                              ▼
                    ┌──────────────────┐
                    │  Lovable Cloud   │
                    │  (Supabase DB)   │
                    │  ┌────────────┐  │
                    │  │ profiles   │  │
                    │  │ user_credits│  │
                    │  │ videos     │  │
                    │  │ user_videos│  │
                    │  │ users_stats│  │
                    │  └────────────┘  │
                    └──────────────────┘
```

---

## Base URL & Authentication

### Base URL

```
https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/
```

### Anon Key (publishable — safe for client-side)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ2ZkcnVybWRicHdjd3p1cmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE5NTEsImV4cCI6MjA4OTIzNzk1MX0.e5oHqItw4gaGeI5w6_xlKJPLGcj8_rIxZMbITLL548E
```

### Authentication Methods

| Function | Auth Method | Header |
|----------|------------|--------|
| `pixi-whatsapp` | None (public webhook) | — |
| `pixi-handoff` | User JWT | `Authorization: Bearer <user_jwt>` |
| `pixi-video-complete` | Internal API Key | `Authorization: Bearer <PIXI_INTERNAL_API_KEY>` |
| `pixi-classify` | None (public) | — |
| `pixi-referral` | User JWT (for `get_stats`) | `Authorization: Bearer <user_jwt>` |
| `sumit-payment` | User JWT | `Authorization: Bearer <user_jwt>` + `apikey: <anon_key>` |
| `pixi-admin` | User JWT (admin check) | `Authorization: Bearer <user_jwt>` + `apikey: <anon_key>` |

---

## Edge Functions Reference

### 1. pixi-whatsapp

**URL:** `POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-whatsapp`

**Purpose:** Main WhatsApp webhook. Receives messages, validates tokens, manages user sessions, forwards to OpenClaw AI.

**JWT:** `verify_jwt = false` (public webhook)

#### Webhook Verification (GET)

For Meta WhatsApp Business API webhook registration:

```
GET /functions/v1/pixi-whatsapp?hub.mode=subscribe&hub.verify_token=pixi-verify-2024&hub.challenge=CHALLENGE_STRING
```

Returns the `hub.challenge` value if token matches.

#### Standard Message (POST)

**Format A — Direct:**
```json
{
  "from": "972501234567",
  "body": "היי Pixi! קוד ההתחברות שלי הוא PX-ABC123",
  "messageId": "optional-dedup-id"
}
```

**Format B — Meta Cloud API:**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "972501234567",
          "type": "text",
          "text": { "body": "שלח לי סרטון על פיצה" },
          "id": "wamid.xxx"
        }]
      }
    }]
  }]
}
```

#### Internal Action: Post Video (POST)

Called by the video generation system after a video is ready:

```json
{
  "action": "post_video",
  "user_id": "uuid-of-user",
  "video_url": "https://storage.example.com/video.mp4"
}
```

**Response:**
```json
{
  "reply": "🎬 הסרטון שלך מוכן! 🎉\n\n📥 https://...\n\nנשארו לך *2 קרדיטים* החודש.",
  "userId": "uuid",
  "plan": "creator",
  "creditsRemaining": 2
}
```

#### Standard Message Response:
```json
{
  "reply": "שלום! 👋\nאני *Pixi* – יוצר סרטוני AI. 🎬\n\nכתוב לי על מה הסרטון...",
  "userId": "uuid-or-undefined",
  "plan": "free",
  "creditsRemaining": 1
}
```

#### Message Handling Logic:

1. **Token detected** (`PX-XXXXXX` pattern):
   - Validates token in `pixi_handoff_tokens`
   - Checks expiry (5 min TTL)
   - Marks token as used
   - Links phone → profile (clears phone from previous profiles)
   - Returns greeting with plan info

2. **Known user** (phone already linked):
   - Checks credits remaining
   - If no credits → sends upgrade nudge with payment links
   - If credits available → forwards to OpenClaw AI

3. **Unknown user**:
   - Returns signup prompt with link to `https://pixibot3316.lovable.app/signup`

---

### 2. pixi-handoff

**URL:** `POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-handoff`

**Purpose:** Generates a one-time handoff token (PX-XXXXXX) for linking a web user to WhatsApp.

**Auth:** User JWT required (`Authorization: Bearer <jwt>`)

**Request Body (optional):**
```json
{
  "language": "he"   // "he" (default) or "en"
}
```

**Response:**
```json
{
  "token": "PX-AB3K7Z",
  "expiresAt": "2026-03-18T12:05:00.000Z",
  "whatsappUrl": "https://wa.me/972525515776?text=%D7%94%D7%99%D7%99%20Pixi!%20%D7%A7%D7%95%D7%93%20%D7%94%D7%94%D7%AA%D7%97%D7%91%D7%A8%D7%95%D7%AA%20%D7%A9%D7%9C%D7%99%20%D7%94%D7%95%D7%90%20PX-AB3K7Z"
}
```

**Token format:** `PX-` + 6 chars from `[A-Z0-9]` (excluding ambiguous O, I, 1, 0)

**TTL:** 5 minutes

**cURL example:**
```bash
curl -X POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-handoff \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language": "he"}'
```

---

### 3. pixi-video-complete

**URL:** `POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-video-complete`

**Purpose:** Called when a video export finishes. Uploads file (if needed), verifies, updates DB, records stats.

**Auth:** Internal API Key (`Authorization: Bearer <PIXI_INTERNAL_API_KEY>`)

#### Mode A — JSON (video already uploaded externally)

```json
{
  "video_id": "uuid-of-video",
  "video_url": "user-id/videos/video-id.mp4"
}
```

#### Mode B — Multipart Form Data (upload to storage)

```
POST /functions/v1/pixi-video-complete
Content-Type: multipart/form-data
Authorization: Bearer <PIXI_INTERNAL_API_KEY>

video_id: "uuid-of-video"
file: <binary video file>
```

**Response (success):**
```json
{
  "success": true,
  "video_id": "uuid",
  "video_url": "user-id/videos/video-id.mp4",
  "status": "completed"
}
```

**What it does:**
1. Uploads file to `user-files` storage bucket (Mode B only)
2. Verifies file accessibility via HEAD request
3. Updates `videos` table: `status → "completed"`, sets `video_url`
4. Upserts `user_videos` record with `generation_time` (seconds)
5. DB trigger auto-updates `users_stats` (total count, total time, last created)

**Error states:**
- `upload_failed` — file upload to storage failed
- `404` — video_id not found in `videos` table

**cURL example:**
```bash
# Mode A
curl -X POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-video-complete \
  -H "Authorization: Bearer YOUR_PIXI_INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"video_id": "abc-123", "video_url": "user-id/videos/abc-123.mp4"}'

# Mode B
curl -X POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-video-complete \
  -H "Authorization: Bearer YOUR_PIXI_INTERNAL_API_KEY" \
  -F "video_id=abc-123" \
  -F "file=@/path/to/video.mp4"
```

---

### 4. pixi-classify

**URL:** `POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-classify`

**Purpose:** AI-powered video classification into categories and tags.

**JWT:** `verify_jwt = false`

**Request:**
```json
{
  "video_id": "uuid-of-video"
}
```

**Response:**
```json
{
  "category": "Marketing",
  "tags": ["marketing", "promo", "social"]
}
```

**Categories:** `Marketing`, `Social Media`, `Ads`, `Tutorials`, `Product Demo`, `Announcement`, `Other`

**Classification flow:**
1. If `LOVABLE_API_KEY` exists → uses Gemini AI for smart classification
2. Fallback → keyword-based matching (Hebrew + English keywords)

---

### 5. pixi-referral

**URL:** `POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-referral`

**JWT:** `verify_jwt = false`

#### Actions:

**`attribute_signup`** — Record a referral when a new user signs up
```json
{
  "action": "attribute_signup",
  "referral_code": "PIXI1A2B3C4D",
  "referred_user_id": "uuid-of-new-user"
}
```

**`attribute_payment`** — Convert referral when referred user pays
```json
{
  "action": "attribute_payment",
  "referred_user_id": "uuid-of-paying-user"
}
```
Awards 3 extra credits to the referrer.

**`get_stats`** — Get referral stats for authenticated user
```json
{
  "action": "get_stats"
}
```
Requires `Authorization: Bearer <user_jwt>`.

**`admin_stats`** — Admin-only: get all referral stats
```json
{
  "action": "admin_stats"
}
```
Requires admin JWT.

---

### 6. sumit-payment

**URL:** `POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/sumit-payment`

**Auth:** User JWT + anon key

**Actions:**

**`open_terminal`** — Create a credit pack payment session
```json
{
  "action": "open_terminal",
  "pack_credits": 10,
  "pack_price": 99,
  "success_url": "https://pixibot3316.lovable.app/payment/callback",
  "cancel_url": "https://pixibot3316.lovable.app/pricing"
}
```

**`verify_payment`** — Verify a completed payment
```json
{
  "action": "verify_payment",
  "payment_id": "uuid-of-payment"
}
```

---

### 7. pixi-admin

**URL:** `POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-admin`

**Auth:** User JWT + anon key (admin role checked via DB)

**Actions:** `list_users`, `list_videos`, `list_user_stats`, `update_user_credits`, etc.

---

## Database Schema

### Key Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, WhatsApp number, verification status |
| `user_credits` | Credit balance per user (plan_credits + extra_credits - used_credits) |
| `subscriptions` | Active subscription plan info |
| `videos` | All generated videos (status, URL, category, tags) |
| `user_videos` | Per-video tracking with generation_time |
| `users_stats` | Aggregated stats (total videos, total gen time) |
| `pixi_handoff_tokens` | One-time PX-XXXXXX tokens for WhatsApp linking |
| `projects` | User projects (video containers) |
| `referral_codes` | Each user's referral code |
| `referrals` | Referral relationships (who referred whom) |
| `referral_rewards` | Credits awarded for successful referrals |
| `payments` | Payment transaction records |
| `credit_transactions` | Credit movement audit log |
| `customers` | Sumit payment gateway customer records |
| `user_roles` | Admin/user role assignments |

### Credit System

```
Available credits = plan_credits + extra_credits - used_credits
```

- **Free plan:** 1 credit
- **Starter:** 3/month (₪49)
- **Creator:** 7/month (₪99)
- **Pro:** 15/month (₪199)
- **Business:** 35/month (₪399)
- **Enterprise:** 80/month (₪799)
- **Admin/Unlimited:** `is_unlimited = true`, never runs out

### DB Functions

| Function | Purpose |
|----------|---------|
| `consume_credit(p_user_id)` | Deduct 1 credit, returns JSON with remaining |
| `add_extra_credits(p_user_id, p_amount)` | Add purchased/reward credits |
| `is_admin(p_user_id)` | Check if user has admin role |
| `ensure_admin_credits(p_user_id)` | Set admin to unlimited enterprise |
| `increment_view_count(p_video_id)` | Increment video view counter |

### DB Triggers

| Trigger | On Table | Action |
|---------|----------|--------|
| `trg_update_user_stats` | `user_videos` INSERT | Updates `users_stats` (count, time, last date) |
| `trg_update_user_stats_on_update` | `user_videos` UPDATE | Updates gen time when status → completed |
| `handle_new_user` | `auth.users` INSERT | Creates profile |
| `handle_new_user_credits` | `auth.users` INSERT | Creates free plan + subscription |
| `handle_new_user_role` | `auth.users` INSERT | Assigns 'user' role |
| `handle_new_user_referral_code` | `auth.users` INSERT | Generates PIXI... referral code |

---

## Secrets & Environment Variables

| Secret Name | Purpose | Where Used |
|-------------|---------|------------|
| `SUPABASE_URL` | DB connection URL | All edge functions (auto-injected) |
| `SUPABASE_ANON_KEY` | Public/anon key | User auth verification |
| `SUPABASE_SERVICE_ROLE_KEY` | Full DB access | Edge functions (server-side only) |
| `PIXI_INTERNAL_API_KEY` | Auth for video-complete | `pixi-video-complete` |
| `OPENCLAW_API_URL` | Your VPS endpoint | `pixi-whatsapp` (OpenClaw bridge) |
| `LOVABLE_API_KEY` | Lovable AI gateway | `pixi-classify` |
| `SUMIT_API_KEY` | Sumit payment API | `sumit-payment` |
| `SUMIT_COMPANY_ID` | Sumit company identifier | `sumit-payment` |
| `SUMIT_API_PUBLIC_KEY` | Sumit public API key | `sumit-payment` |

---

## User Flow Diagrams

### New User → WhatsApp Bot

```
1. User visits pixibot3316.lovable.app/signup
2. Signs up (email/password or Google OAuth)
3. DB triggers create: profile, user_credits (free/1), subscription, referral_code, user role
4. User lands on /dashboard
5. Clicks "Connect WhatsApp" → calls pixi-handoff
6. Gets PX-XXXXXX token + WhatsApp deep link
7. Opens WhatsApp → sends "היי Pixi! קוד ההתחברות שלי הוא PX-ABC123"
8. pixi-whatsapp validates token, links phone → profile
9. Bot replies with greeting + available credits
10. User sends video request → forwarded to OpenClaw
```

### Video Generation Flow

```
1. User sends message via WhatsApp
2. pixi-whatsapp → checks credits → calls consume_credit()
3. Forwards message to OpenClaw API (OPENCLAW_API_URL)
4. OpenClaw processes → generates video
5. OpenClaw calls pixi-video-complete with video file
6. pixi-video-complete uploads to storage, updates videos table
7. DB trigger updates users_stats
8. Bot sends post_video message to pixi-whatsapp
9. User receives video link + credits balance
```

### Returning User

```
1. User sends WhatsApp message (no token)
2. pixi-whatsapp looks up phone in profiles (whatsapp_verified=true)
3. If found → checks credits
4. If credits > 0 → forwards to OpenClaw
5. If credits = 0 → sends upgrade nudge with payment links
```

---

## WhatsApp Message Formats

### Greeting Messages (Hebrew)

**Free user:**
```
שלום [name]! 👋
אני *Pixi* – יוצר סרטוני AI. 🎬

יש לך כרגע *קרדיט אחד חינם* ליצור סרטון ראשון.

כתוב לי על מה הסרטון שאתה רוצה ליצור 🎥
```

**Paid user:**
```
שלום [name]! 👋
אני *Pixi* – יוצר סרטוני AI. 🎬

אתה על חבילת *Creator* עם *5 קרדיטים* החודש.

כתוב לי על מה הסרטון שאתה רוצה ליצור 🎥
```

**Admin:**
```
שלום [name]! 👋

אתה מחובר כעת כמשתמש מנהל.

🎬 סרטונים ללא הגבלה

ספר לי איזה סרטון ליצור!
```

**No credits:**
```
[name], הקרדיטים שלך נגמרו 😔

רוצה ליצור עוד סרטונים? יש לך כמה אפשרויות:

🎬 *Starter* — 3 סרטונים בחודש — ₪49
https://pay.sumit.co.il/.../payment/?pixi_user_id=UUID

🎬 *Creator* — 7 סרטונים בחודש — ₪99
https://pay.sumit.co.il/.../payment/?pixi_user_id=UUID

בחרו חבילה ולחצו על הקישור לתשלום 👆
```

**Video delivered:**
```
🎬 הסרטון שלך מוכן! 🎉

📥 https://storage.example.com/video.mp4

נשארו לך *2 קרדיטים* החודש.

שלח לי את הנושא של הסרטון הבא כשתהיה מוכן 🎬
```

---

## OpenClaw Bridge

### Configuration

Set the `OPENCLAW_API_URL` secret to your VPS endpoint (e.g., `http://your-vps:3000/api/chat`).

### Request sent TO OpenClaw:

```json
POST <OPENCLAW_API_URL>
Content-Type: application/json

{
  "message": "שלח לי סרטון על פיצה",
  "user_id": "uuid-of-user",
  "phone": "972501234567",
  "source": "whatsapp"
}
```

### Expected response FROM OpenClaw:

Any of these fields will be used (checked in order):
```json
{ "reply": "..." }
{ "message": "..." }
{ "response": "..." }
{ "text": "..." }
{ "output": "..." }
```

### Minimal VPS example (Node.js):

```javascript
const express = require("express");
const app = express();
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { message, user_id, phone, source } = req.body;
  const aiReply = await yourOpenClawAgent.chat(message, { user_id });
  res.json({ reply: aiReply });
});

app.listen(3000);
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (missing params) |
| 401 | Unauthorized (invalid/missing auth) |
| 403 | Forbidden (not admin, webhook verify failed) |
| 404 | Resource not found |
| 409 | Conflict (duplicate referral) |
| 500 | Internal server error |

### Error Response Format

```json
{
  "error": "Human-readable error message"
}
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `"Missing authorization"` | No JWT in handoff request | User must be logged in |
| `"No credits remaining"` | `consume_credit` failed | User needs to upgrade |
| `"Invalid referral code"` | Code not in `referral_codes` | Check code format |
| `"Upload failed"` | Storage write error | Check bucket permissions |
| `"OPENCLAW_API_URL not configured"` | Missing secret | Add secret in Lovable Cloud |

---

## Testing

### Test token generation:
```bash
curl -X POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-handoff \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json"
```

### Test WhatsApp message (direct format):
```bash
curl -X POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"from": "972501234567", "body": "PX-TEST01"}'
```

### Test video completion:
```bash
curl -X POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-video-complete \
  -H "Authorization: Bearer <PIXI_INTERNAL_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"video_id": "<uuid>", "video_url": "<storage-path>"}'
```

### Test classification:
```bash
curl -X POST https://hjgfdrurmdbpwcwzuret.supabase.co/functions/v1/pixi-classify \
  -H "Content-Type: application/json" \
  -d '{"video_id": "<uuid>"}'
```

### Test credit consumption:
```bash
# Via Supabase client
const { data } = await supabase.rpc('consume_credit', { p_user_id: 'uuid' });
// Returns: { success: true, remaining: 2, used: 3, total: 5 }
```

---

## Payment Links (Sumit Hosted)

| Plan | Link |
|------|------|
| Starter | `https://pay.sumit.co.il/sngpsi/sol9v3/sol9v4/payment/` |
| Creator | `https://pay.sumit.co.il/sngpsi/snjfxu/snjfxv/payment/` |
| Pro | `https://pay.sumit.co.il/sngpsi/solav9/solava/payment/` |
| Business | `https://pay.sumit.co.il/sngpsi/snrb6s/snrb6t/payment/` |
| Enterprise | `https://pay.sumit.co.il/sngpsi/solbu2/solbu3/payment/` |

Append `?pixi_user_id=UUID&email=user@email.com` to associate payment with user.

---

## WhatsApp Bot Number

```
972525515776
```

Deep link: `https://wa.me/972525515776?text=YOUR_MESSAGE`
