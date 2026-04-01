import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const POLAR_ACCESS_TOKEN = Deno.env.get('POLAR_ACCESS_TOKEN') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const POLAR_API = 'https://api.polar.sh';

// ── Product ID map: {plan_key}_{billing_cycle} → Polar product UUID ──────────
const POLAR_PRODUCTS: Record<string, string> = {
  // Monthly subscriptions
  starter_monthly:    '7b9d4d65-fd0e-40bf-9779-7cfd092b331f',
  creator_monthly:    'ef98ef2a-6f11-4124-bb0e-8d3d4c6499d6',
  pro_monthly:        'c66574d3-b320-4921-9ed5-c5fa6bc442d5',
  business_monthly:   'b3f00ab6-568d-4768-bf72-8a65ac5aa2d4',
  enterprise_monthly: '28eb8f49-e3ab-4034-b28d-9e0264f9c426',
  // Yearly subscriptions
  starter_yearly:     'e3c77faa-b2b8-4d0d-a425-1cf590b9450d',
  creator_yearly:     'fdb46606-cb35-4c0b-84e2-51863db794f8',
  pro_yearly:         'dd2cf617-e4fb-4480-a4b6-d3ec2fd0b36a',
  business_yearly:    '509119c9-f411-4930-b45f-bfe0524afcb2',
  enterprise_yearly:  '7cb94768-f9ad-42a8-ace8-6c2006eedb97',
  // One-time credit packs
  credits_3:          'c48a5a2a-049a-4ba3-b730-8bed6e39df62',
  credits_10:         'c8214823-cabe-4e84-a922-23f324420554',
  credits_25:         '59d7e7ea-34f6-423d-8b30-c6ac570788f9',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const { action, plan_key, product_id, pack_credits, billing_cycle, pixi_user_id } = body;

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Invalid token' }, 401);

    const userId = pixi_user_id || user.id;
    const baseUrl = req.headers.get('origin') || 'https://pixibot.app';

    // ── CREATE CHECKOUT SESSION ──────────────────────────────────────────────
    if (action === 'create_checkout') {
      let productId = product_id;

      if (!productId) {
        if (pack_credits) {
          // Credit pack: key = credits_3 / credits_10 / credits_25
          productId = POLAR_PRODUCTS[`credits_${pack_credits}`];
        } else if (plan_key) {
          // Subscription: key = {plan_key}_{billing_cycle}
          const cycle = billing_cycle || 'monthly';
          productId = POLAR_PRODUCTS[`${plan_key}_${cycle}`];
        }
      }

      if (!productId) {
        const attempted = pack_credits
          ? `credits_${pack_credits}`
          : `${plan_key}_${billing_cycle || 'monthly'}`;
        return json({ error: `Product not configured for: ${attempted}` }, 400);
      }

      const successUrl = `${baseUrl}/payment/callback?checkout_id={CHECKOUT_ID}&plan=${plan_key || ''}&cycle=${billing_cycle || 'monthly'}`;

      const checkoutRes = await fetch(`${POLAR_API}/v1/checkouts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          products: [productId],
          customer_email: user.email,
          external_customer_id: userId,
          success_url: successUrl,
          return_url: `${baseUrl}/pricing`,
          metadata: {
            pixi_user_id: userId,
            plan_key: plan_key || '',
            billing_cycle: billing_cycle || 'monthly',
            pack_credits: pack_credits ? String(pack_credits) : '',
          },
        }),
      });

      if (!checkoutRes.ok) {
        const err = await checkoutRes.text();
        console.error('Polar checkout error:', err);
        return json({ error: 'Failed to create checkout session', details: err }, 500);
      }

      const checkout = await checkoutRes.json();

      // Record pending payment in DB
      await supabase.from('payments').insert({
        user_id: userId,
        amount: 0,
        currency: 'USD',
        status: 'pending',
        payment_type: pack_credits ? 'credit_pack' : 'subscription',
        plan_key: plan_key || null,
        billing_cycle: billing_cycle || 'monthly',
        credits: pack_credits || null,
        polar_checkout_id: checkout.id,
      });

      return json({ checkoutUrl: checkout.url, checkoutId: checkout.id });
    }

    // ── VERIFY CHECKOUT STATUS ───────────────────────────────────────────────
    if (action === 'verify_checkout') {
      const checkoutId = body.checkout_id;
      if (!checkoutId) return json({ status: 'unknown' });

      const checkoutRes = await fetch(`${POLAR_API}/v1/checkouts/${checkoutId}`, {
        headers: { 'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}` },
      });

      if (!checkoutRes.ok) return json({ status: 'unknown' });

      const checkout = await checkoutRes.json();
      return json({ status: checkout.status, succeeded: checkout.status === 'succeeded' });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    console.error('polar-checkout error:', err);
    return json({ error: String(err) }, 500);
  }
});
