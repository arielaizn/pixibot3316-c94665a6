import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { action, ...params } = await req.json();

    let result: any;

    switch (action) {
      // ── ATTRIBUTE SIGNUP ──
      // Called after a new user signs up with a referral code
      case "attribute_signup": {
        const { referral_code, referred_user_id } = params;
        if (!referral_code || !referred_user_id) {
          return new Response(JSON.stringify({ error: "Missing params" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Find the referrer
        const { data: codeRecord } = await adminClient
          .from("referral_codes")
          .select("user_id")
          .eq("referral_code", referral_code)
          .single();

        if (!codeRecord) {
          return new Response(JSON.stringify({ error: "Invalid referral code" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Anti-abuse: can't refer yourself
        if (codeRecord.user_id === referred_user_id) {
          return new Response(JSON.stringify({ error: "Cannot refer yourself" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Anti-abuse: check if this user was already referred
        const { data: existing } = await adminClient
          .from("referrals")
          .select("id")
          .eq("referred_user_id", referred_user_id)
          .limit(1);

        if (existing && existing.length > 0) {
          return new Response(JSON.stringify({ error: "User already referred" }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Create referral record
        const { data: referral, error: refErr } = await adminClient
          .from("referrals")
          .insert({
            referrer_user_id: codeRecord.user_id,
            referred_user_id,
            referral_code,
            status: "signed_up",
          })
          .select()
          .single();

        if (refErr) throw refErr;
        result = referral;
        break;
      }

      // ── ATTRIBUTE PAID CONVERSION ──
      // Called when a referred user makes a payment
      case "attribute_payment": {
        const { referred_user_id } = params;
        if (!referred_user_id) {
          return new Response(JSON.stringify({ error: "Missing referred_user_id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Find referral record for this user that hasn't been converted yet
        const { data: referral } = await adminClient
          .from("referrals")
          .select("*")
          .eq("referred_user_id", referred_user_id)
          .eq("status", "signed_up")
          .single();

        if (!referral) {
          // No pending referral or already converted
          result = { converted: false, reason: "no_pending_referral" };
          break;
        }

        // Update referral status
        await adminClient
          .from("referrals")
          .update({ status: "paid", converted_at: new Date().toISOString() })
          .eq("id", referral.id);

        // Anti-abuse: check if reward already given for this referral
        const { data: existingReward } = await adminClient
          .from("referral_rewards")
          .select("id")
          .eq("source_referral_id", referral.id)
          .limit(1);

        if (existingReward && existingReward.length > 0) {
          result = { converted: true, reward_already_given: true };
          break;
        }

        // Grant reward: 3 extra credits to the referrer
        const REWARD_CREDITS = 3;

        const { data: rewardData, error: rewardErr } = await adminClient
          .from("referral_rewards")
          .insert({
            user_id: referral.referrer_user_id,
            reward_type: "extra_credits",
            reward_value: REWARD_CREDITS,
            source_referral_id: referral.id,
          })
          .select()
          .single();

        if (rewardErr) throw rewardErr;

        // Add credits to user balance
        await adminClient.rpc("add_extra_credits", {
          p_user_id: referral.referrer_user_id,
          p_amount: REWARD_CREDITS,
        });

        result = { converted: true, reward: rewardData };
        break;
      }

      // ── GET REFERRAL STATS (for user dashboard) ──
      case "get_stats": {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: authErr } = await userClient.auth.getUser();
        if (authErr || !user) {
          return new Response(JSON.stringify({ error: "Invalid token" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get or create referral code
        let { data: codeRecord } = await adminClient
          .from("referral_codes")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!codeRecord) {
          const code = "PIXI" + user.id.replace(/-/g, "").substring(0, 8).toUpperCase();
          const { data: newCode } = await adminClient
            .from("referral_codes")
            .insert({ user_id: user.id, referral_code: code })
            .select()
            .single();
          codeRecord = newCode;
        }

        // Get referrals
        const { data: referrals } = await adminClient
          .from("referrals")
          .select("*")
          .eq("referrer_user_id", user.id)
          .order("created_at", { ascending: false });

        // Get rewards
        const { data: rewards } = await adminClient
          .from("referral_rewards")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        // Get referred user emails
        const referredIds = (referrals || [])
          .map((r: any) => r.referred_user_id)
          .filter(Boolean);

        let referredEmails: Record<string, string> = {};
        if (referredIds.length > 0) {
          const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
          if (authUsers?.users) {
            for (const u of authUsers.users) {
              if (referredIds.includes(u.id)) {
                referredEmails[u.id] = u.email || "";
              }
            }
          }
        }

        const totalRewards = (rewards || []).reduce((sum: number, r: any) => sum + (r.reward_value || 0), 0);

        result = {
          referral_code: codeRecord?.referral_code || "",
          referrals: (referrals || []).map((r: any) => ({
            ...r,
            referred_email: referredEmails[r.referred_user_id] || "",
          })),
          rewards: rewards || [],
          stats: {
            total_invited: (referrals || []).length,
            total_paid: (referrals || []).filter((r: any) => r.status === "paid").length,
            total_rewards: totalRewards,
          },
        };
        break;
      }

      // ── ADMIN REFERRAL STATS ──
      case "admin_stats": {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: authErr } = await userClient.auth.getUser();
        if (authErr || !user) {
          return new Response(JSON.stringify({ error: "Invalid token" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: isAdmin } = await adminClient.rpc("is_admin", { p_user_id: user.id });
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // All referrals
        const { data: allReferrals } = await adminClient
          .from("referrals")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);

        const { data: allRewards } = await adminClient
          .from("referral_rewards")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);

        // Get user emails for display
        const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const emailMap: Record<string, string> = {};
        if (authUsers?.users) {
          for (const u of authUsers.users) {
            emailMap[u.id] = u.email || "";
          }
        }

        const totalSignups = (allReferrals || []).filter((r: any) => r.status === "signed_up" || r.status === "paid").length;
        const totalPaid = (allReferrals || []).filter((r: any) => r.status === "paid").length;
        const totalRewardsGranted = (allRewards || []).reduce((sum: number, r: any) => sum + (r.reward_value || 0), 0);

        // Top referrers
        const referrerCounts: Record<string, number> = {};
        (allReferrals || []).forEach((r: any) => {
          referrerCounts[r.referrer_user_id] = (referrerCounts[r.referrer_user_id] || 0) + 1;
        });
        const topReferrers = Object.entries(referrerCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([userId, count]) => ({
            email: emailMap[userId] || userId,
            count,
          }));

        result = {
          totalSignups,
          totalPaid,
          totalRewardsGranted,
          topReferrers,
          referrals: (allReferrals || []).slice(0, 50).map((r: any) => ({
            ...r,
            referrer_email: emailMap[r.referrer_user_id] || "",
            referred_email: emailMap[r.referred_user_id] || "",
          })),
        };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("referral error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
