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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const companyId = Deno.env.get("SUMIT_COMPANY_ID");
  const apiKey = Deno.env.get("SUMIT_API_KEY");
  const adminClient = createClient(supabaseUrl, serviceKey);

  try {
    if (!companyId || !apiKey) {
      throw new Error("Sumit credentials not configured");
    }

    const credentials = {
      CompanyID: Number(companyId),
      APIKey: apiKey,
    };

    // Parse webhook payload from Sumit
    const payload = await req.json();
    console.log("Webhook received:", JSON.stringify(payload));

    // Extract transaction info - Sumit sends various field names
    const transactionId =
      payload.TransactionID ||
      payload.transactionId ||
      payload.Data?.TransactionID ||
      payload.PaymentID ||
      payload.paymentId;

    if (!transactionId) {
      console.error("No transaction ID in webhook payload");
      return new Response(JSON.stringify({ error: "Missing transaction ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate company ID if present in payload
    const webhookCompanyId = payload.CompanyID || payload.companyId;
    if (webhookCompanyId && String(webhookCompanyId) !== String(companyId)) {
      console.error("Company ID mismatch:", webhookCompanyId, "vs", companyId);
      return new Response(JSON.stringify({ error: "Invalid company" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── IDEMPOTENCY: Check if already processed ──
    const { data: existingPayment } = await adminClient
      .from("payments")
      .select("id, status")
      .eq("sumit_transaction_id", String(transactionId))
      .maybeSingle();

    if (existingPayment?.status === "completed") {
      console.log("Transaction already processed:", transactionId);
      return new Response(
        JSON.stringify({ status: "already_processed", payment_id: existingPayment.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── VERIFY with Sumit API ──
    const verifyRes = await fetch(`${SUMIT_BASE}/billing/payments/get/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Credentials: credentials,
        PaymentID: transactionId,
      }),
    });
    const verifyData = await verifyRes.json();
    console.log("Sumit verify response:", JSON.stringify(verifyData));

    if (!verifyData.Data && !verifyData.Status) {
      console.error("Sumit verification failed:", verifyData);
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentData = verifyData.Data || verifyData;
    const paymentStatus = paymentData.StatusCode || paymentData.Status;

    // Status must indicate success (Sumit uses various codes)
    const isSuccess =
      paymentStatus === 0 ||
      paymentStatus === "success" ||
      paymentStatus === "Success" ||
      paymentData.IsApproved === true;

    if (!isSuccess) {
      console.error("Payment not successful, status:", paymentStatus);

      // Update payment record if we can find it
      const customField = tryParseCustomField(paymentData.CustomField || payload.CustomField);
      if (customField?.payment_id) {
        await adminClient
          .from("payments")
          .update({ status: "failed", sumit_transaction_id: String(transactionId) })
          .eq("id", customField.payment_id);
      }

      return new Response(JSON.stringify({ error: "Payment not successful" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Extract custom field to find our payment record ──
    const customField = tryParseCustomField(
      paymentData.CustomField || payload.CustomField
    );

    if (!customField?.payment_id || !customField?.user_id) {
      console.error("Missing custom field data:", customField);
      return new Response(JSON.stringify({ error: "Missing payment metadata" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { payment_id, user_id } = customField;

    // ── Fetch payment record ──
    const { data: payment, error: pErr } = await adminClient
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .eq("user_id", user_id)
      .single();

    if (pErr || !payment) {
      console.error("Payment record not found:", payment_id, pErr);
      return new Response(JSON.stringify({ error: "Payment record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── IDEMPOTENCY: double-check ──
    if (payment.status === "completed") {
      return new Response(
        JSON.stringify({ status: "already_processed", payment_id: payment.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify amount matches
    const sumitAmount = paymentData.Sum || paymentData.Amount;
    if (sumitAmount && Math.abs(Number(sumitAmount) - Number(payment.amount)) > 0.01) {
      console.error("Amount mismatch:", sumitAmount, "vs", payment.amount);
      await adminClient
        .from("payments")
        .update({ status: "amount_mismatch", sumit_transaction_id: String(transactionId) })
        .eq("id", payment_id);
      return new Response(JSON.stringify({ error: "Amount mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── MARK COMPLETED ──
    await adminClient
      .from("payments")
      .update({ status: "completed", sumit_transaction_id: String(transactionId) })
      .eq("id", payment_id);

    // ── ACTIVATE SUBSCRIPTION or CREDITS ──
    if (payment.payment_type === "subscription" && payment.plan_key) {
      const planCredits = PLAN_CREDITS[payment.plan_key] || 0;

      // Update user credits
      await adminClient
        .from("user_credits")
        .update({
          plan_type: payment.plan_key,
          plan_credits: planCredits,
          used_credits: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

      // Deactivate old subscriptions
      await adminClient
        .from("subscriptions")
        .update({ status: "inactive" })
        .eq("user_id", user_id)
        .eq("status", "active");

      // Create new subscription
      const cycleDays = payment.billing_cycle === "yearly" ? 365 : 30;
      const cycleEnd = new Date(Date.now() + cycleDays * 86400000).toISOString();

      await adminClient.from("subscriptions").insert({
        user_id,
        plan_type: payment.plan_key,
        monthly_credits: planCredits,
        status: "active",
        billing_cycle_start: new Date().toISOString(),
        billing_cycle_end: cycleEnd,
      });

      await adminClient.from("credit_transactions").insert({
        user_id,
        type: "plan_upgrade",
        amount: planCredits,
        source: `${payment.plan_key}_${payment.billing_cycle}`,
      });

      console.log("Subscription activated:", payment.plan_key, "for user:", user_id);
    } else if (payment.payment_type === "credit_pack" && payment.credits) {
      await adminClient.rpc("add_extra_credits", {
        p_user_id: user_id,
        p_amount: payment.credits,
      });

      await adminClient.from("credit_purchases").insert({
        user_id,
        credits: payment.credits,
        payment_id: payment.id,
      });

      console.log("Credits added:", payment.credits, "for user:", user_id);
    }

    // ── CREATE & SEND INVOICE (non-blocking) ──
    try {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name")
        .eq("user_id", user_id)
        .maybeSingle();

      const { data: userData } = await adminClient.auth.admin.getUserById(user_id);
      const userEmail = userData?.user?.email || "";

      const invoiceResult = await sumitCall(credentials, "/accounting/documents/create/", {
        Document: {
          Type: 320,
          CustomerName: profile?.full_name || userEmail.split("@")[0] || "",
          CustomerEmail: userEmail,
          Items: [
            {
              Name:
                payment.payment_type === "subscription"
                  ? `Pixi ${payment.plan_key} Plan`
                  : `Pixi Credit Pack (${payment.credits} videos)`,
              Price: payment.amount,
              Quantity: 1,
            },
          ],
          SendByEmail: true,
          Language: "he",
        },
      });

      const docId = invoiceResult.Data?.DocumentID || invoiceResult.DocumentID;
      if (docId) {
        await sumitCall(credentials, "/accounting/documents/send/", {
          DocumentID: docId,
          Email: userEmail,
        }).catch((e: any) => console.error("Invoice send failed:", e));
      }
    } catch (invoiceErr) {
      console.error("Invoice creation failed (non-blocking):", invoiceErr);
    }

    return new Response(
      JSON.stringify({ status: "success", payment_id: payment.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function tryParseCustomField(value: any): { payment_id?: string; user_id?: string; type?: string } | null {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function sumitCall(
  credentials: { CompanyID: number; APIKey: string },
  endpoint: string,
  body: Record<string, any>
) {
  const res = await fetch(`${SUMIT_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Credentials: credentials, ...body }),
  });
  const data = await res.json();
  if (data.Status === false || data.Error) {
    throw new Error(data.UserErrorMessage || data.ErrorMessage || "Sumit API error");
  }
  return data;
}
