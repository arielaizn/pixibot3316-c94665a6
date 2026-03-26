#!/usr/bin/env node
/**
 * Data Migration Script
 * Migrates data from old Lovable project to new Supabase project
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// New Supabase project credentials
const NEW_SUPABASE_URL = 'https://ymhcczxxrgcnyxaqmohj.supabase.co';
const NEW_SUPABASE_SERVICE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY;

if (!NEW_SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing NEW_SUPABASE_SERVICE_KEY environment variable');
  console.log('Please run: export NEW_SUPABASE_SERVICE_KEY="your-service-key"');
  process.exit(1);
}

const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_KEY);

// Load JSON files
const dataDir = path.join(__dirname, 'migration-data');
const loadJSON = (filename) => {
  try {
    const filePath = path.join(dataDir, filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`❌ Error loading ${filename}:`, err.message);
    return [];
  }
};

async function getUserMapping() {
  console.log('\n📋 Step 1: Creating user email → ID mapping...\n');

  const oldProfiles = loadJSON('profiles.json');

  // Get all users from new project
  const { data: newUsers, error } = await supabase.auth.admin.listUsers({
    perPage: 1000
  });

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  const mapping = {};
  const notFound = [];

  for (const oldProfile of oldProfiles) {
    const email = oldProfile.user_email;
    const oldUserId = oldProfile.user_id;

    const newUser = newUsers.users.find(u => u.email === email);

    if (newUser) {
      mapping[oldUserId] = newUser.id;
      console.log(`✅ ${email}: ${oldUserId} → ${newUser.id}`);
    } else {
      notFound.push({ email, oldUserId });
      console.log(`⚠️  ${email}: User not found in new project`);
    }
  }

  if (notFound.length > 0) {
    console.log(`\n⚠️  Warning: ${notFound.length} users not found in new project`);
    console.log('These users will be skipped in migration.');
  }

  return mapping;
}

async function migrateProfiles(userMapping) {
  console.log('\n📋 Step 2: Migrating profiles...\n');

  const oldProfiles = loadJSON('profiles.json');
  let success = 0;
  let skipped = 0;

  for (const profile of oldProfiles) {
    const newUserId = userMapping[profile.user_id];

    if (!newUserId) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        user_id: newUserId,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        whatsapp_number: profile.whatsapp_number,
        whatsapp_verified: profile.whatsapp_verified,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }, { onConflict: 'user_id' });

    if (error) {
      console.error(`❌ Failed to migrate profile for ${profile.user_email}:`, error.message);
    } else {
      console.log(`✅ Migrated profile: ${profile.user_email}`);
      success++;
    }
  }

  console.log(`\n✅ Profiles: ${success} migrated, ${skipped} skipped`);
}

async function migrateUserCredits(userMapping) {
  console.log('\n📋 Step 3: Migrating user_credits...\n');

  const oldCredits = loadJSON('user_credits.json');
  let success = 0;
  let skipped = 0;

  for (const credit of oldCredits) {
    const newUserId = userMapping[credit.user_id];

    if (!newUserId) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('user_credits')
      .upsert({
        user_id: newUserId,
        plan_type: credit.plan_type,
        plan_credits: credit.plan_credits,
        extra_credits: credit.extra_credits,
        used_credits: credit.used_credits,
        is_unlimited: credit.is_unlimited,
        billing_cycle_start: credit.billing_cycle_start
      }, { onConflict: 'user_id' });

    if (error) {
      console.error(`❌ Failed to migrate credits for ${credit.user_email}:`, error.message);
    } else {
      console.log(`✅ Migrated credits: ${credit.user_email} (${credit.plan_type})`);
      success++;
    }
  }

  console.log(`\n✅ User Credits: ${success} migrated, ${skipped} skipped`);
}

async function migrateSubscriptions(userMapping) {
  console.log('\n📋 Step 4: Migrating subscriptions...\n');

  const oldSubs = loadJSON('subscriptions.json');
  let success = 0;
  let skipped = 0;

  for (const sub of oldSubs) {
    const newUserId = userMapping[sub.user_id];

    if (!newUserId) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        id: sub.id,
        user_id: newUserId,
        plan_type: sub.plan_type,
        monthly_credits: sub.monthly_credits,
        status: sub.status,
        billing_cycle_start: sub.billing_cycle_start,
        billing_cycle_end: sub.billing_cycle_end
      });

    if (error) {
      console.error(`❌ Failed to migrate subscription for ${sub.user_email}:`, error.message);
    } else {
      console.log(`✅ Migrated subscription: ${sub.user_email} (${sub.plan_type})`);
      success++;
    }
  }

  console.log(`\n✅ Subscriptions: ${success} migrated, ${skipped} skipped`);
}

async function migrateProjects(userMapping) {
  console.log('\n📋 Step 5: Migrating projects...\n');

  const oldProjects = loadJSON('projects.json');
  let success = 0;
  let skipped = 0;

  for (const project of oldProjects) {
    const newUserId = userMapping[project.user_id];

    if (!newUserId) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('projects')
      .upsert({
        id: project.id,
        user_id: newUserId,
        name: project.name,
        status: project.status,
        created_at: project.created_at
      });

    if (error) {
      console.error(`❌ Failed to migrate project "${project.name}":`, error.message);
    } else {
      console.log(`✅ Migrated project: ${project.name} (${project.user_email})`);
      success++;
    }
  }

  console.log(`\n✅ Projects: ${success} migrated, ${skipped} skipped`);
}

async function migrateVideos(userMapping) {
  console.log('\n📋 Step 6: Migrating videos...\n');

  const oldVideos = loadJSON('videos.json');
  let success = 0;
  let skipped = 0;

  for (const video of oldVideos) {
    const newUserId = userMapping[video.user_id];

    if (!newUserId) {
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
      console.error(`❌ Failed to migrate video "${video.title}":`, error.message);
    } else {
      console.log(`✅ Migrated video: ${video.title || 'Untitled'}`);
      success++;
    }
  }

  console.log(`\n✅ Videos: ${success} migrated, ${skipped} skipped`);
}

async function migrateUserVideos(userMapping) {
  console.log('\n📋 Step 7: Migrating user_videos...\n');

  const oldUserVideos = loadJSON('user_videos.json');
  let success = 0;
  let skipped = 0;

  for (const uv of oldUserVideos) {
    const newUserId = userMapping[uv.user_id];

    if (!newUserId) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('user_videos')
      .upsert({
        id: uv.id,
        user_id: newUserId,
        video_id: uv.video_id,
        file_url: uv.file_url,
        generation_time: uv.generation_time,
        status: uv.status,
        created_at: uv.created_at
      });

    if (error) {
      console.error(`❌ Failed to migrate user_video:`, error.message);
    } else {
      console.log(`✅ Migrated user_video: ${uv.user_email}`);
      success++;
    }
  }

  console.log(`\n✅ User Videos: ${success} migrated, ${skipped} skipped`);
}

async function migrateUsersStats(userMapping) {
  console.log('\n📋 Step 8: Migrating users_stats...\n');

  const oldStats = loadJSON('users_stats.json');
  let success = 0;
  let skipped = 0;

  for (const stat of oldStats) {
    const newUserId = userMapping[stat.user_id];

    if (!newUserId) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('users_stats')
      .upsert({
        user_id: newUserId,
        total_videos_created: stat.total_videos_created,
        total_generation_time: stat.total_generation_time,
        last_video_created_at: stat.last_video_created_at
      }, { onConflict: 'user_id' });

    if (error) {
      console.error(`❌ Failed to migrate users_stats for ${stat.user_email}:`, error.message);
    } else {
      console.log(`✅ Migrated users_stats: ${stat.user_email}`);
      success++;
    }
  }

  console.log(`\n✅ Users Stats: ${success} migrated, ${skipped} skipped`);
}

async function migrateReferralCodes(userMapping) {
  console.log('\n📋 Step 9: Migrating referral_codes...\n');

  const oldCodes = loadJSON('referral_codes.json');
  let success = 0;
  let skipped = 0;

  for (const code of oldCodes) {
    const newUserId = userMapping[code.user_id];

    if (!newUserId) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('referral_codes')
      .upsert({
        id: code.id,
        user_id: newUserId,
        referral_code: code.referral_code
      }, { onConflict: 'user_id' });

    if (error) {
      console.error(`❌ Failed to migrate referral_code for ${code.user_email}:`, error.message);
    } else {
      console.log(`✅ Migrated referral_code: ${code.referral_code} (${code.user_email})`);
      success++;
    }
  }

  console.log(`\n✅ Referral Codes: ${success} migrated, ${skipped} skipped`);
}

async function migrateReferrals(userMapping) {
  console.log('\n📋 Step 10: Migrating referrals...\n');

  const oldReferrals = loadJSON('referrals.json');
  let success = 0;
  let skipped = 0;

  for (const ref of oldReferrals) {
    const newReferrerId = userMapping[ref.referrer_user_id];
    const newReferredId = userMapping[ref.referred_user_id];

    if (!newReferrerId || !newReferredId) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('referrals')
      .upsert({
        id: ref.id,
        referrer_user_id: newReferrerId,
        referred_user_id: newReferredId,
        referral_code: ref.referral_code,
        status: ref.status,
        converted_at: ref.converted_at
      });

    if (error) {
      console.error(`❌ Failed to migrate referral:`, error.message);
    } else {
      console.log(`✅ Migrated referral: ${ref.referrer_email} → ${ref.referred_email}`);
      success++;
    }
  }

  console.log(`\n✅ Referrals: ${success} migrated, ${skipped} skipped`);
}

async function migrateCreditTransactions(userMapping) {
  console.log('\n📋 Step 11: Migrating credit_transactions...\n');

  const oldTransactions = loadJSON('credit_transactions.json');
  let success = 0;
  let skipped = 0;

  for (const tx of oldTransactions) {
    const newUserId = userMapping[tx.user_id];

    if (!newUserId) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('credit_transactions')
      .upsert({
        id: tx.id,
        user_id: newUserId,
        type: tx.type,
        amount: tx.amount,
        source: tx.source,
        created_at: tx.created_at
      });

    if (error) {
      console.error(`❌ Failed to migrate credit_transaction for ${tx.user_email}:`, error.message);
    } else {
      console.log(`✅ Migrated credit_transaction: ${tx.user_email} (+${tx.amount})`);
      success++;
    }
  }

  console.log(`\n✅ Credit Transactions: ${success} migrated, ${skipped} skipped`);
}

async function migratePayments(userMapping) {
  console.log('\n📋 Step 12: Migrating payments...\n');

  const oldPayments = loadJSON('payments.json');
  let success = 0;
  let skipped = 0;

  for (const payment of oldPayments) {
    const newUserId = userMapping[payment.user_id];

    if (!newUserId) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('payments')
      .upsert({
        id: payment.id,
        user_id: newUserId,
        amount: payment.amount,
        credits: payment.credits,
        currency: payment.currency,
        status: payment.status,
        payment_type: payment.payment_type,
        plan_key: payment.plan_key,
        billing_cycle: payment.billing_cycle
      });

    if (error) {
      console.error(`❌ Failed to migrate payment for ${payment.user_email}:`, error.message);
    } else {
      console.log(`✅ Migrated payment: ${payment.user_email} (₪${payment.amount})`);
      success++;
    }
  }

  console.log(`\n✅ Payments: ${success} migrated, ${skipped} skipped`);
}

async function main() {
  console.log('🚀 Starting Data Migration from Old Project to New Project\n');
  console.log('━'.repeat(60));

  try {
    // Step 1: User mapping
    const userMapping = await getUserMapping();

    if (Object.keys(userMapping).length === 0) {
      console.error('\n❌ No users to migrate. Exiting.');
      process.exit(1);
    }

    // Step 2-12: Migrate all tables
    await migrateProfiles(userMapping);
    await migrateUserCredits(userMapping);
    await migrateSubscriptions(userMapping);
    await migrateProjects(userMapping);
    await migrateVideos(userMapping);
    await migrateUserVideos(userMapping);
    await migrateUsersStats(userMapping);
    await migrateReferralCodes(userMapping);
    await migrateReferrals(userMapping);
    await migrateCreditTransactions(userMapping);
    await migratePayments(userMapping);

    console.log('\n' + '━'.repeat(60));
    console.log('✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
