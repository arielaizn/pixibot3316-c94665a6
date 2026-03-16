WhatsApp onboarding conversion funnel rules and flow logic

## Token Flow
- User gets PX-XXXXXX token from dashboard → sends to Pixi WhatsApp
- Token validated, phone linked to profile, greeting sent

## Greeting Logic
- Free users: "יש לך קרדיט אחד חינם"
- Paid users: show remaining credits + plan name
- Admins (pixmindstudio3316@gmail.com, aa046114609@gmail.com): unlimited, never upsell

## Upgrade Nudge Rules
- Only when: credits=0, user requests another video, plan=free
- Never interrupt active video creation
- Show max 3 plan options above current plan
- Include Sumit hosted payment links with ?pixi_user_id=

## Payment Links
- starter: https://pay.sumit.co.il/sngpsi/sol9v3/sol9v4/payment/
- creator: https://pay.sumit.co.il/sngpsi/snjfxu/snjfxv/payment/
- pro: https://pay.sumit.co.il/sngpsi/solav9/solava/payment/
- business: https://pay.sumit.co.il/sngpsi/snrb6s/snrb6t/payment/
- enterprise: https://pay.sumit.co.il/sngpsi/solbu2/solbu3/payment/

## Edge Function
- supabase/functions/pixi-whatsapp/index.ts (verify_jwt=false, public webhook)
- Supports Meta Cloud API webhook format + direct format
- GET handler for webhook verification (hub.verify_token)
