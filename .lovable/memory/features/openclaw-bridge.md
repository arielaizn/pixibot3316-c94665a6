OpenClaw bridge integration via pixi-whatsapp edge function

## How it works
- Authenticated WhatsApp users (post-token-verification) have their messages forwarded to OpenClaw API
- Token verification, greetings, and upgrade nudges remain handled locally
- Only regular messages from verified users go to OpenClaw
- No-credits users get upgrade nudge instead of AI forwarding

## Secret
- OPENCLAW_API_URL: user's VPS endpoint (e.g. http://vps-ip:port/api/chat)

## Request format sent to OpenClaw
POST { message, user_id, phone, source: "whatsapp" }

## Expected response from OpenClaw
JSON with one of: reply, message, response, text, output
