#!/usr/bin/env node
/**
 * Fix Hebrew encoding in projects
 */

import { createClient } from '@supabase/supabase-js';

const NEW_SUPABASE_URL = 'https://ymhcczxxrgcnyxaqmohj.supabase.co';
const NEW_SUPABASE_SERVICE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY;

const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_KEY);

// Correct names mapping (from original data)
const nameCorrections = {
  '3 ×©×¢××ª ×©××©× × ×× ××ª ××¢×¡×§': '3 שעות שישנו את העסק',
  '×××××ª ×××¤×¨×¥ â ××× 3D': 'לגו כווית – לגו 3D',
  '×××××ª ××¤×× ××¡×× â ××× 3D': 'לגו אפגניסטן – לגו 3D',
  '×××¦×¢ ×©×××ª ×××¨× â ××× 3D': 'מצור הפרץ – לגו 3D',
  'Red Bull â ××¤×¦××¦××': 'Red Bull – אפצוצים',
  '××¨×××': 'פרויקט',
};

async function fixProjectNames() {
  console.log('🔧 Fixing Hebrew encoding in project names...\n');

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name');

  if (error) {
    console.error('❌ Error fetching projects:', error.message);
    return;
  }

  let fixed = 0;
  let unchanged = 0;

  for (const project of projects) {
    const correctName = nameCorrections[project.name];

    if (correctName) {
      console.log(`📝 Fixing: "${project.name}" → "${correctName}"`);

      const { error: updateError } = await supabase
        .from('projects')
        .update({ name: correctName })
        .eq('id', project.id);

      if (updateError) {
        console.error(`   ❌ Failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ Fixed!`);
        fixed++;
      }
    } else {
      console.log(`✅ OK: "${project.name}"`);
      unchanged++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Fixed: ${fixed} projects`);
  console.log(`✅ Already correct: ${unchanged} projects`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

async function fixVideoTitles() {
  console.log('🔧 Fixing Hebrew encoding in video titles...\n');

  const titleCorrections = {
    '3 ×©×¢××ª ×©××©× × ×× ××ª ××¢×¡×§ â eleven_v3': '3 שעות שישנו את העסק – eleven_v3',
    '×××××ª ×××¤×¨×¥ â ××× 3D': 'לגו כווית – לגו 3D',
    '×××××ª ××¤×× ××¡×× â ××× 3D': 'לגו אפגניסטן – לגו 3D',
  };

  const { data: videos, error } = await supabase
    .from('videos')
    .select('id, title');

  if (error) {
    console.error('❌ Error fetching videos:', error.message);
    return;
  }

  let fixed = 0;
  let unchanged = 0;

  for (const video of videos) {
    const correctTitle = titleCorrections[video.title];

    if (correctTitle) {
      console.log(`📝 Fixing: "${video.title}" → "${correctTitle}"`);

      const { error: updateError } = await supabase
        .from('videos')
        .update({ title: correctTitle })
        .eq('id', video.id);

      if (updateError) {
        console.error(`   ❌ Failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ Fixed!`);
        fixed++;
      }
    } else {
      console.log(`✅ OK: "${video.title}"`);
      unchanged++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Fixed: ${fixed} videos`);
  console.log(`✅ Already correct: ${unchanged} videos`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

async function fixProfileNames() {
  console.log('🔧 Fixing Hebrew encoding in profile names...\n');

  const nameCorrections = {
    '××¨××× ×××× ×©××': 'אריאל סולר שוו',
    '×¦××¤× ×××× ×©××': 'ציפי סולר שוו',
    '×©××ª× ×××× ×©×× - ××¨ ××¦××× ××××ª×': 'שבתי סולר שוו - אור אירועים וחתונות',
  };

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name');

  if (error) {
    console.error('❌ Error fetching profiles:', error.message);
    return;
  }

  let fixed = 0;
  let unchanged = 0;

  for (const profile of profiles) {
    const correctName = nameCorrections[profile.full_name];

    if (correctName) {
      console.log(`📝 Fixing: "${profile.full_name}" → "${correctName}"`);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: correctName })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`   ❌ Failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ Fixed!`);
        fixed++;
      }
    } else {
      console.log(`✅ OK: "${profile.full_name}"`);
      unchanged++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Fixed: ${fixed} profiles`);
  console.log(`✅ Already correct: ${unchanged} profiles`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

async function main() {
  console.log('🚀 Starting Encoding Fix\n');
  console.log('═'.repeat(60) + '\n');

  await fixProjectNames();
  await fixVideoTitles();
  await fixProfileNames();

  console.log('═'.repeat(60));
  console.log('✅ All encoding issues fixed!\n');
}

main();
