import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WHATSAPP_NUMBER = "972525515776";

async function hasActiveChallenge(adminClient: ReturnType<typeof createClient>): Promise<boolean> {
  const { data } = await adminClient
    .from("challenges")
    .select("id")
    .eq("is_active", true)
    .lte("start_date", new Date().toISOString())
    .gte("end_date", new Date().toISOString())
    .limit(1);
  return (data && data.length > 0) || false;
}

function generateShortToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  for (const byte of arr) {
    code += chars[byte % chars.length];
  }
  return `PX-${code}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse optional body for language preference
    let language = "he";
    try {
      const body = await req.json();
      if (body?.language === "en") language = "en";
    } catch {
      // No body or invalid JSON — default to Hebrew
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin via DB function (no hardcoded emails)
    const { data: isAdminResult } = await adminClient.rpc("is_admin", { p_user_id: user.id });
    const isAdmin = isAdminResult === true;

    // If admin, ensure credits reflect unlimited status via DB function
    if (isAdmin) {
      await adminClient.rpc("ensure_admin_credits", { p_user_id: user.id });
    }

    // Fetch user credits to determine plan and quota
    const { data: userCredits } = await adminClient
      .from("user_credits")
      .select("plan_type, plan_credits, extra_credits, used_credits, is_unlimited")
      .eq("user_id", user.id)
      .maybeSingle();

    const challengeActive = await hasActiveChallenge(adminClient);
    const isUnlimited = userCredits?.is_unlimited === true || isAdmin || challengeActive;
    const plan = isUnlimited ? "enterprise" : (userCredits?.plan_type || "free");
    const quota = isUnlimited ? 999999 : Math.max(0, (userCredits?.plan_credits || 0) + (userCredits?.extra_credits || 0) - (userCredits?.used_credits || 0));

    // Generate short human-friendly token
    const token = generateShortToken();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: insertError } = await adminClient
      .from("pixi_handoff_tokens")
      .insert({
        token,
        user_id: user.id,
        plan,
        quota,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create handoff token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build WhatsApp message based on language
    const message = language === "en"
      ? `Hi Pixi! My access code is ${token}`
      : `היי Pixi! קוד ההתחברות שלי הוא ${token}`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    return new Response(
      JSON.stringify({
        token,
        expiresAt,
        whatsappUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Handoff error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
