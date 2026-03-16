Referral reward program terms, tier pricing rules, and founding class discount structure

## Tables
- referral_codes: user_id → unique referral_code (PIXI + 8 hex chars), auto-created on signup via trigger
- referrals: referrer_user_id, referred_user_id, status (clicked/signed_up/paid), converted_at
- referral_rewards: user_id (referrer), reward_type, reward_value, source_referral_id

## Reward Logic
- Reward granted only on paid conversion (status = "paid")
- Default reward: 3 extra credits via add_extra_credits RPC
- Anti-abuse: no self-referral, one attribution per referred user, no duplicate rewards

## Edge Function
- supabase/functions/pixi-referral/index.ts (verify_jwt = false)
- Actions: attribute_signup, attribute_payment, get_stats, admin_stats

## Frontend
- Referral code captured from ?ref= param → localStorage("pixi_referral_code")
- Attribution happens in AuthContext on auth state change
- ReferralCard component in DashboardPage
- Admin page at /admin/referrals

## Link Format
- {origin}/signup?ref={REFERRAL_CODE}
