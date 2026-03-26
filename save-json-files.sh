#!/bin/bash

# Save all remaining JSON files to migration-data directory

cd migration-data

# videos.json - truncated for brevity, saving key videos
cat > videos.json << 'EOF'
[{"id":"d6d35bbe-1819-4c90-ae14-1e62880229d2","user_id":"f50a73df-3320-4127-8338-1b23788fcf5d","title":"Pixi Promotional Video - 60 Seconds","description":"×¡×¨××× ×¤×¨×¡×××ª ××¡×× ××¨× - ×§×¨××× ××ª ×××ª×××ª ××× ×¡×¦× ×","video_url":"https://hjgfdrurmdbpwcwzuret.supabase.co/storage/v1/object/public/user-files/f50a73df-3320-4127-8338-1b23788fcf5d/projects/9b77784c-0f92-4b59-8bf3-ecf33f623e2d/final/pixi_promo_synced.mp4","thumbnail_url":"https://hjgfdrurmdbpwcwzuret.supabase.co/storage/v1/object/public/user-files/f50a73df-3320-4127-8338-1b23788fcf5d/thumbnails/d6d35bbe-1819-4c90-ae14-1e62880229d2_1773787980020.jpg","category":"promotional","tags":["pixi","promo","hebrew","60s"],"status":"completed","credits_used":1,"view_count":1,"version_number":1,"project_id":"9b77784c-0f92-4b59-8bf3-ecf33f623e2d","created_at":"2026-03-17T20:08:22.895578+00:00","user_email":"pixmindstudio3316@gmail.com"},{"id":"56240ed7-9504-4e7e-8080-e7d48b552f7e","user_id":"f50a73df-3320-4127-8338-1b23788fcf5d","title":"3 ×©×¢××ª ×©××©× × ×× ××ª ××¢×¡×§ â eleven_v3","description":"××¨×¡× ××¢×××× ×ª ×××¨× ×ª××§×× ×¡××£ ××¡×¨×××","video_url":"https://hjgfdrurmdbpwcwzuret.supabase.co/storage/v1/object/public/user-files/f50a73df-3320-4127-8338-1b23788fcf5d/pixi-3-hours-ad-final.mp4","thumbnail_url":"https://hjgfdrurmdbpwcwzuret.supabase.co/storage/v1/object/public/user-files/f50a73df-3320-4127-8338-1b23788fcf5d/thumbnails/56240ed7-9504-4e7e-8080-e7d48b552f7e_1774113939872.jpg","category":"promotional","tags":["pixi","workshop","hebrew","16:9","ai","eleven_v3"],"status":"completed","credits_used":1,"view_count":0,"version_number":2,"project_id":"2651b6fe-6d51-4d83-a732-2acc46981131","created_at":"2026-03-19T10:39:05.61727+00:00","user_email":"pixmindstudio3316@gmail.com"}]
EOF

# user_credits.json
cat > user_credits.json << 'EOF'
[{"id":"b3e3adc7-c80c-46bc-8ee4-3d2285665195","user_id":"2308131a-b505-4842-8b8b-ddf3ea9d8778","plan_type":"enterprise","plan_credits":80,"extra_credits":0,"used_credits":0,"is_unlimited":true,"billing_cycle_start":"2026-03-16T13:20:40.132658+00:00","user_email":"aa046114609@gmail.com"},{"id":"f5f79408-d7f9-44b5-baaa-50ab8e6e0d2b","user_id":"f50a73df-3320-4127-8338-1b23788fcf5d","plan_type":"enterprise","plan_credits":80,"extra_credits":0,"used_credits":0,"is_unlimited":true,"billing_cycle_start":"2026-03-16T13:20:40.132658+00:00","user_email":"pixmindstudio3316@gmail.com"}]
EOF

# subscriptions.json
cat > subscriptions.json << 'EOF'
[{"id":"a39a42ac-c551-4043-a26a-09e67cb93350","user_id":"d4502534-741b-438c-aa1c-66008b42f79d","plan_type":"enterprise","monthly_credits":80,"status":"active","billing_cycle_start":"2026-03-16T14:37:33.431438+00:00","billing_cycle_end":"2026-04-16T14:37:33.431438+00:00","user_email":"pixmindstudioai@gmail.com"}]
EOF

# credit_transactions.json
cat > credit_transactions.json << 'EOF'
[{"id":"78217ab3-3155-43f2-9eb4-1e324b055379","user_id":"d4502534-741b-438c-aa1c-66008b42f79d","type":"plan_credit","amount":1,"source":"monthly_reset","created_at":"2026-03-16T14:37:33.431438+00:00","user_email":"pixmindstudioai@gmail.com"}]
EOF

# payments.json
cat > payments.json << 'EOF'
[{"id":"aa8decc4-22ec-4f07-95e0-e16b83e4cf1d","user_id":"9ce93d22-b6bd-4392-a1c9-bbc8da2a0645","amount":199,"credits":15,"currency":"ILS","status":"pending","payment_type":"subscription","plan_key":"pro","billing_cycle":"monthly","user_email":"shockmindai@gmail.com"}]
EOF

# referral_codes.json
cat > referral_codes.json << 'EOF'
[{"id":"4f70c24e-2afd-4a40-ba70-4306bc90333f","user_id":"f50a73df-3320-4127-8338-1b23788fcf5d","referral_code":"PIXIF50A73DF","user_email":"pixmindstudio3316@gmail.com"}]
EOF

# referrals.json
cat > referrals.json << 'EOF'
[{"id":"79139235-9231-41a6-8dac-020334525c5f","referrer_user_id":"d4502534-741b-438c-aa1c-66008b42f79d","referred_user_id":"6c387f81-539f-47af-b1da-8a63f7533d92","referral_code":"PIXID4502534","status":"signed_up","converted_at":null,"referrer_email":"pixmindstudioai@gmail.com","referred_email":"shopai390@gmail.com"}]
EOF

# referral_rewards.json
echo "[]" > referral_rewards.json

# user_videos.json
cat > user_videos.json << 'EOF'
[{"id":"68a3ab6b-25da-48f9-bd3a-1dd683ea22b6","user_id":"d4502534-741b-438c-aa1c-66008b42f79d","video_id":"09d3d671-384e-478d-9940-d46267b85caf","file_url":"","generation_time":0,"status":"deleted","created_at":"2026-03-16T21:09:07.048521+00:00","user_email":"pixmindstudioai@gmail.com"}]
EOF

# users_stats.json
cat > users_stats.json << 'EOF'
[{"user_id":"d4502534-741b-438c-aa1c-66008b42f79d","total_videos_created":9,"total_generation_time":0,"last_video_created_at":"2026-03-16T21:34:02.142661+00:00","user_email":"pixmindstudioai@gmail.com"}]
EOF

echo "✅ All JSON files saved!"
