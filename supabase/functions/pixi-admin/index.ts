import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAILS = [
  "pixmindstudio3316@gmail.com",
  "aa046114609@gmail.com",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller is an admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify JWT with anon client
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role via DB function
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await adminClient.rpc("is_admin", { p_user_id: user.id });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      // ── LIST USERS ──
      case "list_users": {
        const { data: users } = await adminClient.auth.admin.listUsers({
          page: params.page || 1,
          perPage: params.perPage || 50,
        });
        // Enrich with credits
        const userIds = users?.users?.map((u: any) => u.id) || [];
        const { data: credits } = await adminClient
          .from("user_credits")
          .select("*")
          .in("user_id", userIds);
        const { data: roles } = await adminClient
          .from("user_roles")
          .select("*")
          .in("user_id", userIds);

        const enriched = users?.users?.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name || u.user_metadata?.name || "",
          created_at: u.created_at,
          credits: credits?.find((c: any) => c.user_id === u.id) || null,
          roles: roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [],
        }));

        result = { users: enriched, total: users?.users?.length || 0 };
        break;
      }

      // ── UPDATE USER CREDITS ──
      case "update_credits": {
        const { user_id, plan_type, plan_credits, extra_credits, used_credits } = params;
        const updates: any = {};
        if (plan_type !== undefined) updates.plan_type = plan_type;
        if (plan_credits !== undefined) updates.plan_credits = plan_credits;
        if (extra_credits !== undefined) updates.extra_credits = extra_credits;
        if (used_credits !== undefined) updates.used_credits = used_credits;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await adminClient
          .from("user_credits")
          .update(updates)
          .eq("user_id", user_id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        break;
      }

      // ── ADD CREDITS ──
      case "add_credits": {
        const { user_id, amount } = params;
        const { data, error } = await adminClient.rpc("add_extra_credits", {
          p_user_id: user_id,
          p_amount: amount,
        });
        if (error) throw error;
        result = data;
        break;
      }

      // ── RESET CREDITS ──
      case "reset_credits": {
        const { user_id } = params;
        const { error } = await adminClient
          .from("user_credits")
          .update({ used_credits: 0, updated_at: new Date().toISOString() })
          .eq("user_id", user_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      // ── SET USER ROLE ──
      case "set_role": {
        const { user_id, role } = params;
        if (!ADMIN_EMAILS.includes(user.email || "")) {
          // Only hardcoded admins can set roles
          return new Response(JSON.stringify({ error: "Only super admins can set roles" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error } = await adminClient
          .from("user_roles")
          .upsert({ user_id, role }, { onConflict: "user_id,role" });
        if (error) throw error;
        result = { success: true };
        break;
      }

      // ── LIST SUBSCRIPTIONS ──
      case "list_subscriptions": {
        const { data, error } = await adminClient
          .from("subscriptions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        result = data;
        break;
      }

      // ── UPDATE SUBSCRIPTION ──
      case "update_subscription": {
        const { id, ...updates } = params;
        const { data, error } = await adminClient
          .from("subscriptions")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // ── LIST VIDEOS ──
      case "list_videos": {
        const { data, error } = await adminClient
          .from("videos")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        result = data;
        break;
      }

      // ── DELETE VIDEO ──
      case "delete_video": {
        const { id } = params;
        const { error } = await adminClient.from("videos").delete().eq("id", id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      // ── LIST PROJECTS ──
      case "list_projects": {
        const { data, error } = await adminClient
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        result = data;
        break;
      }

      // ── DELETE PROJECT ──
      case "delete_project": {
        const { id } = params;
        const { error } = await adminClient.from("projects").delete().eq("id", id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      // ── LIST HANDOFF TOKENS ──
      case "list_handoff_tokens": {
        const { data, error } = await adminClient
          .from("pixi_handoff_tokens")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        result = data;
        break;
      }

      // ── INVALIDATE TOKEN ──
      case "invalidate_token": {
        const { id } = params;
        const { error } = await adminClient
          .from("pixi_handoff_tokens")
          .update({ used: true })
          .eq("id", id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      // ── LIST CREDIT TRANSACTIONS ──
      case "list_transactions": {
        const { data, error } = await adminClient
          .from("credit_transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        result = data;
        break;
      }

      // ── DASHBOARD STATS ──
      case "dashboard_stats": {
        const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const totalUsers = authUsers?.users?.length || 0;

        const { count: totalVideos } = await adminClient
          .from("videos")
          .select("*", { count: "exact", head: true });

        const { count: totalProjects } = await adminClient
          .from("projects")
          .select("*", { count: "exact", head: true });

        const { count: activeTokens } = await adminClient
          .from("pixi_handoff_tokens")
          .select("*", { count: "exact", head: true })
          .eq("used", false)
          .gt("expires_at", new Date().toISOString());

        result = {
          totalUsers,
          totalVideos: totalVideos || 0,
          totalProjects: totalProjects || 0,
          activeTokens: activeTokens || 0,
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
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
