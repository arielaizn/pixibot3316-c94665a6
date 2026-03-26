#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const NEW_SUPABASE_URL = 'https://ymhcczxxrgcnyxaqmohj.supabase.co';
const NEW_SUPABASE_SERVICE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY;
const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_KEY);

// User mapping (from previous migration)
const userMapping = {
  '2308131a-b505-4842-8b8b-ddf3ea9d8778': 'eaf715cc-8182-40fe-b3d7-f67bb444dd36',
  'f50a73df-3320-4127-8338-1b23788fcf5d': '403ee78c-6660-4d27-b9f3-54836985b917',
  '4f7bfc3d-cbd1-4d4e-9199-59fcd02f88cf': 'dcec3250-bbbe-48cf-b994-d790ede96a64',
};

async function migrateVideos() {
  console.log('📹 Migrating all videos...\n');

  const videos = JSON.parse(fs.readFileSync('migration-data/videos-full.json', 'utf-8'));

  let success = 0;
  let skipped = 0;

  for (const video of videos) {
    const newUserId = userMapping[video.user_id];

    if (!newUserId) {
      console.log(`⚠️  Skipped: ${video.title || 'Untitled'} (user not found)`);
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('videos')
      .upsert({
        id: video.id,
        user_id: newUserId,
        title: video.title,
        description: video.description,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        category: video.category,
        tags: video.tags,
        status: video.status,
        credits_used: video.credits_used,
        view_count: video.view_count,
        version_number: video.version_number,
        project_id: video.project_id,
        created_at: video.created_at
      });

    if (error) {
      console.error(`❌ Failed: ${video.title || 'Untitled'} - ${error.message}`);
    } else {
      console.log(`✅ Migrated: ${video.title || 'Untitled'}`);
      success++;
    }
  }

  console.log(`\n✅ Videos: ${success} migrated, ${skipped} skipped\n`);
}

migrateVideos();
