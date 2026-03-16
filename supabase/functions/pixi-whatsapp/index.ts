import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * pixi-whatsapp — WhatsApp webhook for the Pixi AI video platform.
 *
 * Incoming messages from the WhatsApp Business API hit this endpoint.
 * The function:
 *  1. Validates the handoff token (PX-XXXXXX)
 *  2. Identifies the user and their plan/credits
 *  3. Returns a personalised response (greeting, video prompt, upgrade nudge)
 *
 * All responses are in Hebrew by default.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Plan metadata ──
const PLAN_CREDITS: Record<string, number> = {
  free: 1,
  starter: 3,
  creator: 7,
  pro: 15,
  business: 35,
  enterprise: 80,
};

const PLAN_PAYMENT_LINKS: Record<string, string> = {
  starter: "https://pay.sumit.co.il/sngpsi/sol9v3/sol9v4/payment/",
  creator: "https://pay.sumit.co.il/sngpsi/snjfxu/snjfxv/payment/",
  pro: "https://pay.sumit.co.il/sngpsi/solav9/solava/payment/",
  business: "https://pay.sumit.co.il/sngpsi/snrb6s/snrb6t/payment/",
  enterprise: "https://pay.sumit.co.il/sngpsi/solbu2/solbu3/payment/",
};

const ADMIN_EMAILS = [
  "pixmindstudio3316@gmail.com",
  "aa046114609@gmail.com",
];

// ── Token regex ──
const TOKEN_REGEX = /PX-[A-Z0-9]{6}/;

// ── Types ──
interface WhatsAppMessage {
  from: string;       // sender phone number
  body: string;       // message text
  messageId?: string; // optional dedup
}

interface BotResponse {
  reply: string;
  userId?: string;
  plan?: string;
  creditsRemaining?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // WhatsApp verify (GET) for webhook registration
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "pixi-verify-2024";

    if (mode === "subscribe" && token === verifyToken) {
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const payload = await req.json();
    console.log("WhatsApp webhook payload:", JSON.stringify(payload));

    // ── Internal action: post_video (called by video generation system) ──
    if (payload.action === "post_video") {
      const { user_id, video_url } = payload;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "Missing user_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: userData } = await admin.auth.admin.getUserById(user_id);
      const email = userData?.user?.email || "";
      const isAdmin = ADMIN_EMAILS.includes(email);

      const { data: credits } = await admin
        .from("user_credits")
        .select("*")
        .eq("user_id", user_id)
        .maybeSingle();

      const { data: profile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("user_id", user_id)
        .maybeSingle();

      const plan = credits?.plan_type || "free";
      const isUnlimited = credits?.is_unlimited || isAdmin;
      const remaining = isUnlimited
        ? -1
        : Math.max(0, (credits?.plan_credits || 0) + (credits?.extra_credits || 0) - (credits?.used_credits || 0));

      // Detect first video: used_credits was 0 before this one (now 1)
      const isFirstVideo = plan === "free" && (credits?.used_credits || 0) <= 1;

      const reply = buildPostVideoResponse(
        user_id,
        plan,
        remaining,
        profile?.full_name?.split(" ")[0] || "",
        video_url,
        isFirstVideo
      );

      return new Response(JSON.stringify({ reply, userId: user_id, plan, creditsRemaining: remaining }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Standard WhatsApp message handling ──
    const msg = extractMessage(payload);
    if (!msg) {
      return new Response(JSON.stringify({ status: "no_message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await handleMessage(admin, msg);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Extract message from various webhook formats ──
function extractMessage(payload: any): WhatsAppMessage | null {
  // Direct format: { from, body }
  if (payload.from && payload.body) {
    return { from: payload.from, body: payload.body, messageId: payload.messageId };
  }

  // Meta Cloud API format
  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  const message = change?.messages?.[0];
  if (message?.type === "text") {
    return {
      from: message.from,
      body: message.text?.body || "",
      messageId: message.id,
    };
  }

  return null;
}

// ── Main message handler ──
async function handleMessage(
  admin: ReturnType<typeof createClient>,
  msg: WhatsAppMessage
): Promise<BotResponse> {
  const text = msg.body.trim();

  // ── Check for token in message ──
  const tokenMatch = text.match(TOKEN_REGEX);
  if (tokenMatch) {
    return handleTokenMessage(admin, msg.from, tokenMatch[0]);
  }

  // ── Look up user by phone number (returning user) ──
  const user = await findUserByPhone(admin, msg.from);
  if (user) {
    return handleReturningUser(admin, user, text);
  }

  // ── Unknown user — prompt to register ──
  return {
    reply: [
      "שלום! 👋",
      "אני *Pixi* – יוצר סרטוני AI.",
      "",
      "כדי להתחיל, היכנסו לאתר שלנו והירשמו:",
      "https://pixibot3316.lovable.app/signup",
      "",
      "אחרי ההרשמה תקבלו קוד גישה לשליחה כאן 🎬",
    ].join("\n"),
  };
}

// ── Handle first-time token verification ──
async function handleTokenMessage(
  admin: ReturnType<typeof createClient>,
  phone: string,
  token: string
): Promise<BotResponse> {
  // Look up token
  const { data: handoff, error } = await admin
    .from("pixi_handoff_tokens")
    .select("*")
    .eq("token", token)
    .eq("used", false)
    .maybeSingle();

  if (error || !handoff) {
    return {
      reply: [
        "הקוד שהזנת לא תקף או שכבר נעשה בו שימוש. ❌",
        "",
        "נסו ליצור קוד חדש מהדשבורד:",
        "https://pixibot3316.lovable.app/dashboard",
      ].join("\n"),
    };
  }

  // Check expiry
  if (new Date(handoff.expires_at) < new Date()) {
    return {
      reply: [
        "הקוד שלך פג תוקף. ⏰",
        "",
        "היכנסו לדשבורד וצרו קוד חדש:",
        "https://pixibot3316.lovable.app/dashboard",
      ].join("\n"),
    };
  }

  // Mark token as used
  await admin
    .from("pixi_handoff_tokens")
    .update({ used: true })
    .eq("id", handoff.id);

  // Link phone number to user profile
  await admin
    .from("profiles")
    .update({ whatsapp_number: phone, whatsapp_verified: true })
    .eq("user_id", handoff.user_id);

  // Fetch user details
  const { data: userData } = await admin.auth.admin.getUserById(handoff.user_id);
  const email = userData?.user?.email || "";
  const isAdmin = ADMIN_EMAILS.includes(email);

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("user_id", handoff.user_id)
    .maybeSingle();

  const { data: credits } = await admin
    .from("user_credits")
    .select("*")
    .eq("user_id", handoff.user_id)
    .maybeSingle();

  const name = profile?.full_name?.split(" ")[0] || "";
  const greeting = name ? `שלום ${name}! 👋` : "שלום! 👋";
  const plan = credits?.plan_type || "free";
  const isUnlimited = credits?.is_unlimited || isAdmin;
  const remaining = isUnlimited
    ? -1
    : Math.max(0, (credits?.plan_credits || 0) + (credits?.extra_credits || 0) - (credits?.used_credits || 0));

  // ── Admin greeting ──
  if (isAdmin || isUnlimited) {
    return {
      reply: [
        greeting,
        "אני *Pixi* – יוצר סרטוני AI. 🎬",
        "",
        "יש לך גישה *ללא הגבלה*. ♾️",
        "",
        "כתוב לי על מה הסרטון שאתה רוצה ליצור 🎥",
      ].join("\n"),
      userId: handoff.user_id,
      plan: "unlimited",
      creditsRemaining: -1,
    };
  }

  // ── Free user greeting ──
  if (plan === "free") {
    return {
      reply: [
        greeting,
        "אני *Pixi* – יוצר סרטוני AI. 🎬",
        "",
        `יש לך כרגע *קרדיט אחד חינם* ליצור סרטון ראשון.`,
        "",
        "כתוב לי על מה הסרטון שאתה רוצה ליצור 🎥",
      ].join("\n"),
      userId: handoff.user_id,
      plan,
      creditsRemaining: remaining,
    };
  }

  // ── Paid user greeting ──
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  return {
    reply: [
      greeting,
      `אני *Pixi* – יוצר סרטוני AI. 🎬`,
      "",
      `אתה על חבילת *${planLabel}* עם *${remaining} קרדיטים* החודש.`,
      "",
      "כתוב לי על מה הסרטון שאתה רוצה ליצור 🎥",
    ].join("\n"),
    userId: handoff.user_id,
    plan,
    creditsRemaining: remaining,
  };
}

// ── Handle returning user (already linked phone) ──
async function handleReturningUser(
  admin: ReturnType<typeof createClient>,
  user: { userId: string; email: string; fullName: string | null },
  text: string
): Promise<BotResponse> {
  const isAdmin = ADMIN_EMAILS.includes(user.email);

  const { data: credits } = await admin
    .from("user_credits")
    .select("*")
    .eq("user_id", user.userId)
    .maybeSingle();

  const plan = credits?.plan_type || "free";
  const isUnlimited = credits?.is_unlimited || isAdmin;
  const remaining = isUnlimited
    ? -1
    : Math.max(0, (credits?.plan_credits || 0) + (credits?.extra_credits || 0) - (credits?.used_credits || 0));

  const name = user.fullName?.split(" ")[0] || "";

  // ── Admin — never upsell ──
  if (isAdmin || isUnlimited) {
    return {
      reply: [
        name ? `ברוך שחזרת ${name}! 👋` : "ברוך שחזרת! 👋",
        "",
        "יש לך גישה *ללא הגבלה*. ♾️",
        "",
        "על איזה סרטון נעבוד היום? 🎬",
      ].join("\n"),
      userId: user.userId,
      plan: "unlimited",
      creditsRemaining: -1,
    };
  }

  // ── No credits left — upgrade nudge ──
  if (remaining <= 0) {
    return buildUpgradeMessage(user.userId, plan, name);
  }

  // ── Has credits — ready to create ──
  return {
    reply: [
      name ? `ברוך שחזרת ${name}! 👋` : "ברוך שחזרת! 👋",
      `נשארו לך *${remaining} קרדיטים* החודש.`,
      "",
      "על איזה סרטון נעבוד היום? 🎬",
    ].join("\n"),
    userId: user.userId,
    plan,
    creditsRemaining: remaining,
  };
}

// ── Build the upgrade message with payment links ──
function buildUpgradeMessage(
  userId: string,
  currentPlan: string,
  name: string
): BotResponse {
  const greeting = name
    ? `${name}, הקרדיטים שלך נגמרו 😔`
    : "הקרדיטים שלך נגמרו 😔";

  // Only show plans above current plan
  const planOrder = ["free", "starter", "creator", "pro", "business", "enterprise"];
  const currentIndex = planOrder.indexOf(currentPlan);

  const availablePlans = planOrder
    .filter((_, i) => i > currentIndex && i < planOrder.length)
    .slice(0, 3); // Show max 3 options

  const planLabels: Record<string, string> = {
    starter: "🎬 *Starter* — 3 סרטונים בחודש — ₪49",
    creator: "🎬 *Creator* — 7 סרטונים בחודש — ₪99",
    pro: "🎬 *Pro* — 15 סרטונים בחודש — ₪199",
    business: "🏢 *Business* — 35 סרטונים בחודש — ₪399",
    enterprise: "🚀 *Enterprise* — 80 סרטונים בחודש — ₪799",
  };

  const planLines = availablePlans.map((p) => {
    const link = `${PLAN_PAYMENT_LINKS[p]}?pixi_user_id=${userId}`;
    return `${planLabels[p]}\n${link}`;
  });

  return {
    reply: [
      greeting,
      "",
      "רוצה ליצור עוד סרטונים? יש לך כמה אפשרויות:",
      "",
      ...planLines,
      "",
      "בחרו חבילה ולחצו על הקישור לתשלום 👆",
    ].join("\n"),
    userId,
    plan: currentPlan,
    creditsRemaining: 0,
  };
}

// ── Post-video response builder (called after video generation) ──
// Returns the WOW moment message + upgrade nudge when appropriate
export function buildPostVideoResponse(
  userId: string,
  plan: string,
  remaining: number,
  name: string,
  videoUrl?: string,
  isFirstVideo?: boolean
): string {
  const isUnlimited = remaining === -1;

  // ── Video delivery header ──
  const deliveryLines = [
    "🎬 הסרטון שלך מוכן! 🎉",
  ];
  if (videoUrl) {
    deliveryLines.push("", `📥 ${videoUrl}`);
  }

  // ── Admin / unlimited — just deliver ──
  if (isUnlimited) {
    return [
      ...deliveryLines,
      "",
      "שלח לי את הנושא של הסרטון הבא כשתהיה מוכן 🎬",
    ].join("\n");
  }

  // ── Has remaining credits — deliver + show balance ──
  if (remaining > 0) {
    return [
      ...deliveryLines,
      "",
      `נשארו לך *${remaining} קרדיטים* החודש.`,
      "",
      "שלח לי את הנושא של הסרטון הבא כשתהיה מוכן 🎬",
    ].join("\n");
  }

  // ── No credits left — WOW moment + upgrade ──
  const planOrder = ["free", "starter", "creator", "pro", "business", "enterprise"];
  const currentIndex = planOrder.indexOf(plan);
  const nextPlans = planOrder.filter((_, i) => i > currentIndex).slice(0, 3);

  const planLabels: Record<string, string> = {
    starter: "🎬 *Starter* — 3 סרטונים בחודש — ₪49",
    creator: "🎬 *Creator* — 7 סרטונים בחודש — ₪99",
    pro: "🎬 *Pro* — 15 סרטונים בחודש — ₪199",
    business: "🏢 *Business* — 35 סרטונים בחודש — ₪399",
    enterprise: "🚀 *Enterprise* — 80 סרטונים בחודש — ₪799",
  };

  const planLines = nextPlans.map((p) => {
    const link = `${PLAN_PAYMENT_LINKS[p]}?pixi_user_id=${userId}`;
    return `${planLabels[p]}\n${link}`;
  });

  const wowIntro = isFirstVideo
    ? [
        "",
        "רוצה ליצור עוד סרטונים כאלה? 🚀",
        "",
        "Pixi יכול ליצור עבורך סרטונים תוך שניות.",
        "בחר חבילה שמתאימה לך 👇",
      ]
    : [
        "",
        "הקרדיטים שלך נגמרו.",
        "רוצה להמשיך ליצור? בחר חבילה 👇",
      ];

  return [
    ...deliveryLines,
    ...wowIntro,
    "",
    ...planLines,
    "",
    "לחצו על הקישור לתשלום מאובטח 🔒",
  ].join("\n");
}

// ── Find user by WhatsApp phone ──
async function findUserByPhone(
  admin: ReturnType<typeof createClient>,
  phone: string
): Promise<{ userId: string; email: string; fullName: string | null } | null> {
  // Normalize phone: strip + and leading zeros
  const normalized = phone.replace(/^\+/, "").replace(/^0+/, "");

  const { data: profile } = await admin
    .from("profiles")
    .select("user_id, full_name, whatsapp_number")
    .eq("whatsapp_verified", true)
    .not("whatsapp_number", "is", null)
    .limit(100);

  if (!profile) return null;

  // Match by phone suffix (last 9+ digits)
  const match = profile.find((p) => {
    const pNorm = (p.whatsapp_number || "").replace(/^\+/, "").replace(/^0+/, "");
    return pNorm.length >= 9 && normalized.endsWith(pNorm.slice(-9));
  });

  if (!match) return null;

  const { data: userData } = await admin.auth.admin.getUserById(match.user_id);

  return {
    userId: match.user_id,
    email: userData?.user?.email || "",
    fullName: match.full_name,
  };
}
