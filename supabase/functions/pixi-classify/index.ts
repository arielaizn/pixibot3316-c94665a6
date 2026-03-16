import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIES = [
  "Marketing",
  "Social Media",
  "Ads",
  "Tutorials",
  "Product Demo",
  "Announcement",
  "Other",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_id } = await req.json();
    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch video + project info
    const { data: video, error: vErr } = await supabase
      .from("videos")
      .select("id, title, description, project_id")
      .eq("id", video_id)
      .single();

    if (vErr || !video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let projectName = "";
    if (video.project_id) {
      const { data: proj } = await supabase
        .from("projects")
        .select("name")
        .eq("id", video.project_id)
        .single();
      if (proj) projectName = proj.name;
    }

    if (!lovableKey) {
      // Fallback: simple keyword-based classification
      const text = `${video.title || ""} ${video.description || ""} ${projectName}`.toLowerCase();
      let category = "Other";
      let tags: string[] = [];

      if (text.match(/ad|ads|פרסום|פרסומת|campaign/)) { category = "Ads"; tags.push("ad", "promo"); }
      else if (text.match(/market|שיווק|brand/)) { category = "Marketing"; tags.push("marketing"); }
      else if (text.match(/social|חברתי|instagram|tiktok|facebook|reels/)) { category = "Social Media"; tags.push("social"); }
      else if (text.match(/tutorial|הדרכה|guide|מדריך|how to/)) { category = "Tutorials"; tags.push("tutorial"); }
      else if (text.match(/product|מוצר|demo|הדגמה/)) { category = "Product Demo"; tags.push("product", "demo"); }
      else if (text.match(/announce|הכרזה|launch|השקה/)) { category = "Announcement"; tags.push("announcement"); }

      if (text.match(/fitness|כושר/)) tags.push("fitness");
      if (text.match(/food|אוכל/)) tags.push("food");
      if (text.match(/tech|טכנולוגיה/)) tags.push("tech");

      const { error: uErr } = await supabase
        .from("videos")
        .update({ category, tags, content_type: category.toLowerCase().replace(/\s+/g, "_") })
        .eq("id", video_id);

      if (uErr) throw uErr;

      return new Response(JSON.stringify({ category, tags }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI classification via Lovable AI
    const prompt = `Classify this video. Project: "${projectName}". Title: "${video.title || ""}". Description: "${video.description || ""}".
Return JSON with category (one of: ${CATEGORIES.join(", ")}) and tags (array of 2-5 short keywords).`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You classify videos into categories and assign tags. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_video",
              description: "Classify a video into a category and assign tags",
              parameters: {
                type: "object",
                properties: {
                  category: { type: "string", enum: CATEGORIES },
                  tags: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
                },
                required: ["category", "tags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_video" } },
      }),
    });

    if (!aiRes.ok) {
      console.error("AI gateway error:", aiRes.status);
      // Fallback
      const { error: uErr } = await supabase
        .from("videos")
        .update({ category: "Other", tags: [], content_type: "other" })
        .eq("id", video_id);
      return new Response(JSON.stringify({ category: "Other", tags: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let category = "Other";
    let tags: string[] = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        category = CATEGORIES.includes(parsed.category) ? parsed.category : "Other";
        tags = Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => String(t).toLowerCase()) : [];
      } catch { /* keep defaults */ }
    }

    const { error: uErr } = await supabase
      .from("videos")
      .update({ category, tags, content_type: category.toLowerCase().replace(/\s+/g, "_") })
      .eq("id", video_id);

    if (uErr) throw uErr;

    return new Response(JSON.stringify({ category, tags }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
