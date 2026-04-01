import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const POLAR_ACCESS_TOKEN = Deno.env.get('POLAR_ACCESS_TOKEN') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const POLAR_API = 'https://api.polar.sh';

// Product IDs - set via Supabase secrets after creating products in Polar dashboard
const POLAR_PRODUCTS: Record<string, string> = {
  starter:    Deno.env.get('POLAR_PRODUCT_STARTER')    || '',
  creator:    Deno.env.get('POLAR_PRODUCT_CREATOR')    || '',
  pro:        Deno.env.get('POLAR_PRODUCT_PRO')        || '',
  business:   Deno.env.get('POLAR_PRODUCT_BUSINESS')   || '',
  enterprise: Deno.env.get('POLAR_PRODUCT_ENTERPRISE') || '',
  credits_3:  Deno.env.get('POLAR_PRODUCT_CREDITS_3')  || '',
  credits_10: Deno.env.get('POLAR_PRODUCT_CREDITS_10') || '',
  credits_25: Deno.env.get('POLAR_PRODUCT_CREDITS_25') || '',
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
    const { action, plan_key, product_id, pack_credits, billing_cycle, pixi_user_id } = await req.json();

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

      // Map plan_key to product ID
      if (!productId && plan_key) {
        const key = pack_credits
          ? `credits_${pack_credits}`
          : plan_key;
        productId = POLAR_PRODUCTS[key];
      }

      if (!productId) {
        return json({ error: `Product ID not configured for: ${plan_key || product_id}` }, 400);
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
      }).select().maybeSingle();

      return json({ checkoutUrl: checkout.url, checkoutId: checkout.id });
    }

    // ── VERIFY CHECKOUT STATUS ───────────────────────────────────────────────
    if (action === 'verify_checkout') {
      const { checkout_id } = await req.json().catch(() => ({}));
      const cId = checkout_id || req.url.split('checkout_id=')[1];

      const checkoutRes = await fetch(`${POLAR_API}/v1/checkouts/${cId}`, {
        headers: { 'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}` },
      });

      if (!checkoutRes.ok) return json({ status: 'unknown' });

      const checkout = await checkoutRes.json();
      const succeeded = checkout.status === 'succeeded';

      return json({ status: checkout.status, succeeded });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    console.error('polar-checkout error:', err);
    return json({ error: String(err) }, 500);
  }
});
