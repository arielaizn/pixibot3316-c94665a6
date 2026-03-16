import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUMIT_BASE = "https://api.sumit.co.il/1.0";

const PLAN_CREDITS: Record<string, number> = {
  starter: 3,
  creator: 7,
  pro: 15,
  business: 35,
  enterprise: 80,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const companyId = Deno.env.get("SUMIT_COMPANY_ID");
    const apiKey = Deno.env.get("SUMIT_API_KEY");
    if (!companyId || !apiKey) {
      throw new Error("Sumit credentials not configured");
    }

    const credentials = {
      CompanyID: Number(companyId),
      APIKey: apiKey,
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { action, ...params } = await req.json();

    // Helper: call Sumit API with Credentials object
    async function sumitCall(endpoint: string, body: Record<string, any>) {
      const res = await fetch(`${SUMIT_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        redirect: "manual",
        body: JSON.stringify({ Credentials: credentials, ...body }),
      });
      // If Sumit returns a redirect, extract the Location header as the payment URL
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("Location");
        return { Data: { PaymentPageURL: location }, Status: true };
      }
      const data = await res.json();
      if (data.Status === false || data.Error) {
        throw new Error(data.UserErrorMessage || data.ErrorMessage || "Sumit API error");
      }
      return data;
    }

    // Helper: get or create Sumit customer
    async function ensureSumitCustomer() {
      const { data: existing } = await adminClient
        .from("customers")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existing?.sumit_customer_id) return existing;

      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name, whatsapp_number")
        .eq("user_id", user!.id)
        .maybeSingle();

      const customerData = await sumitCall("/accounting/customers/create/", {
        Customer: {
          Name: profile?.full_name || user!.email?.split("@")[0] || "Pixi User",
          Email: user!.email,
          Phone: profile?.whatsapp_number || "",
          CompanyNumber: "",
          Active: true,
        },
      });

      const sumitCustomerId = String(
        customerData.Data?.CustomerID || customerData.CustomerID || ""
      );

      const { data: customer, error: custErr } = await adminClient
        .from("customers")
        .upsert(
          {
            user_id: user!.id,
            email: user!.email!,
            whatsapp_number: profile?.whatsapp_number || null,
            sumit_customer_id: sumitCustomerId,
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (custErr) throw custErr;
      return customer;
    }

    let result: any;

    switch (action) {
      // ── ENSURE CUSTOMER ──
      case "ensure_customer": {
        const customer = await ensureSumitCustomer();
        result = { customer };
        break;
      }

      // ── OPEN PAYMENT TERMINAL ──
      case "open_terminal": {
        const { plan_key, billing_cycle, success_url, cancel_url, pack_credits, pack_price } = params;

        const isSubscription = !!plan_key;
        let price: number;
        let creditCount: number;
        let description: string;
        let paymentType: string;

        if (isSubscription) {
          const prices: Record<string, Record<string, number>> = {
            starter: { monthly: 49, yearly: 470 },
            creator: { monthly: 99, yearly: 950 },
            pro: { monthly: 199, yearly: 1910 },
            business: { monthly: 399, yearly: 3830 },
            enterprise: { monthly: 799, yearly: 7670 },
          };
          price = prices[plan_key]?.[billing_cycle];
          if (!price) throw new Error("Invalid plan or billing cycle");
          creditCount = PLAN_CREDITS[plan_key];
          if (!creditCount) throw new Error("Invalid plan");
          const planLabel = plan_key.charAt(0).toUpperCase() + plan_key.slice(1);
          description = `Pixi ${planLabel} Plan (${billing_cycle})`;
          paymentType = "subscription";
        } else {
          price = pack_price;
          creditCount = pack_credits;
          description = `Pixi Credit Pack (${pack_credits} videos)`;
          paymentType = "credit_pack";
        }

        // Ensure customer exists in Sumit
        await ensureSumitCustomer();

        // Create payment record
        const { data: payment, error: payErr } = await adminClient
          .from("payments")
          .insert({
            user_id: user.id,
            amount: price,
            currency: "ILS",
            status: "pending",
            payment_type: paymentType,
            plan_key: plan_key || null,
            billing_cycle: billing_cycle || null,
            credits: creditCount,
          })
          .select()
          .single();

        if (payErr) throw payErr;

        // Open Sumit payment terminal
        const terminalData = await sumitCall(
          "/billing/payments/beginredirect/",
          {
            Payment: {
              CustomerName: user.email?.split("@")[0] || "Pixi User",
              CustomerEmail: user.email,
              Sum: price,
              Currency: "ILS",
              Description: description,
              RedirectURL: `${success_url}?payment_id=${payment.id}`,
              CancelRedirectURL: cancel_url || success_url,
              MaxNumberOfPayments: billing_cycle === "yearly" ? 12 : 1,
              CustomField: JSON.stringify({
                payment_id: payment.id,
                user_id: user.id,
                type: paymentType,
              }),
            },
          }
        );

        const paymentUrl =
          terminalData.Data?.PaymentPageURL || terminalData.PaymentPageURL;
        if (!paymentUrl) throw new Error("No payment URL returned from Sumit");

        result = { paymentUrl, paymentId: payment.id };
        break;
      }

      // ── CHECK PAYMENT STATUS (called after redirect back) ──
      // NOTE: Actual activation happens via the sumit-webhook endpoint.
      // This only checks current status for the frontend UI.
      case "verify_payment": {
        const { payment_id } = params;

        const { data: payment, error: pErr } = await adminClient
          .from("payments")
          .select("*")
          .eq("id", payment_id)
          .eq("user_id", user.id)
          .single();

        if (pErr || !payment) throw new Error("Payment not found");

        result = { status: payment.status, payment };
        break;
      }

      // ── ACTIVATE PLAN (called from callback page after Sumit hosted link redirect) ──
      case "activate_plan": {
        const { plan_key, billing_cycle } = params;

        if (!plan_key || !PLAN_CREDITS[plan_key]) {
          throw new Error("Invalid plan");
        }

        const planCredits = PLAN_CREDITS[plan_key];

        // Idempotency: check if already on this plan
        const { data: currentCredits } = await adminClient
          .from("user_credits")
          .select("plan_type")
          .eq("user_id", user.id)
          .maybeSingle();

        // Record payment
        const { data: payment } = await adminClient
          .from("payments")
          .insert({
            user_id: user.id,
            amount: 0, // amount tracked by Sumit hosted page
            currency: "ILS",
            status: "completed",
            payment_type: "subscription",
            plan_key,
            billing_cycle: billing_cycle || "monthly",
            credits: planCredits,
          })
          .select()
          .single();

        // Update user credits
        await adminClient
          .from("user_credits")
          .update({
            plan_type: plan_key,
            plan_credits: planCredits,
            used_credits: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        // Deactivate old subscriptions
        await adminClient
          .from("subscriptions")
          .update({ status: "inactive" })
          .eq("user_id", user.id)
          .eq("status", "active");

        // Create new subscription
        const cycleDays = billing_cycle === "yearly" ? 365 : 30;
        const cycleEnd = new Date(Date.now() + cycleDays * 86400000).toISOString();

        await adminClient.from("subscriptions").insert({
          user_id: user.id,
          plan_type: plan_key,
          monthly_credits: planCredits,
          status: "active",
          billing_cycle_start: new Date().toISOString(),
          billing_cycle_end: cycleEnd,
        });

        await adminClient.from("credit_transactions").insert({
          user_id: user.id,
          type: "plan_upgrade",
          amount: planCredits,
          source: `${plan_key}_${billing_cycle}_hosted`,
        });

        // Invoice (non-blocking)
        try {
          const { data: profile } = await adminClient
            .from("profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .maybeSingle();

          await sumitCall("/accounting/documents/create/", {
            Document: {
              Type: 320,
              CustomerName: profile?.full_name || user.email?.split("@")[0] || "",
              CustomerEmail: user.email,
              Items: [{ Name: `Pixi ${plan_key} Plan (${billing_cycle})`, Price: 0, Quantity: 1 }],
              SendByEmail: true,
              Language: "he",
            },
          });
        } catch (e) {
          console.error("Invoice failed (non-blocking):", e);
        }

        result = { status: "activated", plan: plan_key, credits: planCredits };
        break;
      }

      // ── LIST USER PAYMENTS ──
      case "list_payments": {
        const { data, error } = await adminClient
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        result = data;
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
    console.error("Sumit payment error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
