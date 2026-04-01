import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const POLAR_WEBHOOK_SECRET = Deno.env.get('POLAR_WEBHOOK_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Plan credits mapping
const PLAN_CREDITS: Record<string, number> = {
  starter: 3, creator: 7, pro: 15, business: 35, enterprise: 80,
};

// ── WEBHOOK SIGNATURE VERIFICATION (Standard Webhooks / svix) ────────────────
async function verifyWebhookSignature(
  body: string,
  headers: Headers,
): Promise<boolean> {
  const webhookId = headers.get('webhook-id');
  const webhookTimestamp = headers.get('webhook-timestamp');
  const webhookSignature = headers.get('webhook-signature');

  if (!webhookId || !webhookTimestamp || !webhookSignature || !POLAR_WEBHOOK_SECRET) {
    console.error('Missing webhook verification headers or secret');
    return false;
  }

  // Reject old timestamps (>5 minutes)
  const ts = parseInt(webhookTimestamp, 10);
  const diff = Math.abs(Date.now() / 1000 - ts);
  if (diff > 300) {
    console.error('Webhook timestamp too old:', diff, 'seconds');
    return false;
  }

  // Build signed content: id.timestamp.body
  const toSign = `${webhookId}.${webhookTimestamp}.${body}`;

  // Import the secret key (raw format)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(POLAR_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  // Compute expected signature
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(toSign));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  const expectedSig = `v1,${computed}`;

  // Compare with all provided signatures (format: "v1,xxx v1,yyy")
  const providedSigs = webhookSignature.split(' ');
  return providedSigs.some((s) => s === expectedSig);
}

// ── PLAN ACTIVATION ──────────────────────────────────────────────────────────
async function activatePlan(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  planKey: string,
  billingCycle: string,
  orderId: string,
  amount: number,
) {
  const credits = PLAN_CREDITS[planKey] ?? 3;
  const now = new Date();
  const cycleEnd = new Date(now);
  cycleEnd.setMonth(cycleEnd.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

  // Update user_credits
  await supabase.from('user_credits').upsert({
    user_id: userId,
    plan_type: planKey,
    plan_credits: credits,
    extra_credits: 0,
    used_credits: 0,
    billing_cycle_start: now.toISOString(),
    is_unlimited: false,
    updated_at: now.toISOString(),
  }, { onConflict: 'user_id' });

  // Upsert subscription
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    plan_type: planKey,
    monthly_credits: credits,
    billing_cycle_start: now.toISOString(),
    billing_cycle_end: cycleEnd.toISOString(),
    status: 'active',
  }, { onConflict: 'user_id' });

  // Mark payment completed
  await supabase.from('payments')
    .update({ status: 'completed', polar_order_id: orderId, amount })
    .eq('user_id', userId)
    .eq('plan_key', planKey)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);

  // Record transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'plan_upgrade',
    amount: credits,
    source: `polar_${planKey}`,
  });

  console.log(`✅ Plan activated: ${planKey} for user ${userId}`);
}

// ── CREDIT PACK ACTIVATION ───────────────────────────────────────────────────
async function activateCreditPack(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  packCredits: number,
  orderId: string,
  amount: number,
) {
  // Add extra credits
  await supabase.rpc('add_extra_credits', {
    p_user_id: userId,
    p_amount: packCredits,
  });

  // Mark payment completed
  await supabase.from('payments')
    .update({ status: 'completed', polar_order_id: orderId, amount })
    .eq('user_id', userId)
    .eq('payment_type', 'credit_pack')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);

  console.log(`✅ Credit pack activated: ${packCredits} credits for user ${userId}`);
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await req.text();

  // Verify signature
  const valid = await verifyWebhookSignature(rawBody, req.headers);
  if (!valid) {
    console.error('Webhook signature verification failed');
    return new Response('Unauthorized', { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  console.log('Polar webhook event:', event.type);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── order.created - one-time purchase or subscription payment ─────────────
    if (event.type === 'order.created') {
      const order = event.data;
      const meta = order.checkout?.metadata || order.metadata || {};
      const userId = meta.pixi_user_id || order.customer?.external_id;
      const planKey = meta.plan_key || '';
      const billingCycle = meta.billing_cycle || 'monthly';
      const packCredits = meta.pack_credits ? parseInt(meta.pack_credits) : 0;
      const amount = (order.net_amount || 0) / 100; // cents to dollars

      if (!userId) {
        console.error('No user ID in order metadata:', order.id);
        return new Response('Missing user ID', { status: 400 });
      }

      // Idempotency check
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('polar_order_id', order.id)
        .maybeSingle();

      if (existing) {
        console.log('Order already processed:', order.id);
        return new Response('OK', { status: 200 });
      }

      if (packCredits > 0) {
        await activateCreditPack(supabase, userId, packCredits, order.id, amount);
      } else if (planKey) {
        await activatePlan(supabase, userId, planKey, billingCycle, order.id, amount);
      }
    }

    // ── subscription.revoked - cancel plan ────────────────────────────────────
    if (event.type === 'subscription.revoked') {
      const sub = event.data;
      const userId = sub.customer?.external_id;
      if (userId) {
        await supabase.from('user_credits').update({
          plan_type: 'free',
          plan_credits: 1,
          is_unlimited: false,
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId);

        await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId);
        console.log(`Plan revoked for user ${userId}`);
      }
    }

    // ── checkout.updated (succeeded) ──────────────────────────────────────────
    if (event.type === 'checkout.updated' && event.data.status === 'succeeded') {
      console.log('Checkout succeeded:', event.data.id);
      // order.created will handle the activation - nothing to do here
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return new Response(`Error: ${String(err)}`, { status: 500 });
  }
});
