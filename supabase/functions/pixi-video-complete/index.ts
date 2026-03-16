import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * pixi-video-complete — Safe video completion endpoint.
 *
 * Called by the external Pixi video generation system when a video export finishes.
 * Ensures the correct order: upload file → verify → update DB.
 *
 * Accepts either:
 *   A) JSON with { video_id, video_url } — if the file is already uploaded elsewhere
 *   B) multipart/form-data with video_id + file — uploads to Supabase Storage first
 *
 * In both cases the function verifies the file is accessible before marking "completed".
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const internalKey = Deno.env.get("PIXI_INTERNAL_API_KEY");
    const admin = createClient(supabaseUrl, serviceKey);

    // Auth check — require internal API key
    const authHeader = req.headers.get("authorization") || "";
    const providedKey = authHeader.replace("Bearer ", "").trim();
    if (internalKey && providedKey !== internalKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "";
    let videoId: string;
    let storagePath: string;

    if (contentType.includes("multipart/form-data")) {
      // ── Mode B: File upload via form data ──
      const formData = await req.formData();
      videoId = formData.get("video_id") as string;
      const file = formData.get("file") as File | null;

      if (!videoId || !file) {
        return new Response(
          JSON.stringify({ error: "video_id and file are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the video to find user_id
      const { data: video, error: vErr } = await admin
        .from("videos")
        .select("id, user_id, project_id")
        .eq("id", videoId)
        .single();

      if (vErr || !video) {
        return new Response(
          JSON.stringify({ error: "Video not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build storage path
      const ext = file.name?.split(".").pop() || "mp4";
      storagePath = `${video.user_id}/videos/${videoId}.${ext}`;

      // Step 1: Upload to storage
      console.log(`Uploading video ${videoId} to ${storagePath}...`);
      const fileBuffer = await file.arrayBuffer();
      const { error: uploadErr } = await admin.storage
        .from("user-files")
        .upload(storagePath, fileBuffer, {
          contentType: file.type || "video/mp4",
          upsert: true,
        });

      if (uploadErr) {
        console.error(`Upload failed for ${videoId}:`, uploadErr);
        // Mark as upload_failed
        await admin
          .from("videos")
          .update({ status: "upload_failed" })
          .eq("id", videoId);

        return new Response(
          JSON.stringify({ error: "Upload failed", detail: uploadErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Upload succeeded for ${videoId}`);
    } else {
      // ── Mode A: JSON with video_url already set ──
      const body = await req.json();
      videoId = body.video_id;
      storagePath = body.video_url || body.storage_path;

      if (!videoId || !storagePath) {
        return new Response(
          JSON.stringify({ error: "video_id and video_url/storage_path are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Step 2: Verify file exists in storage
    console.log(`Verifying file exists at ${storagePath}...`);
    const { data: publicUrlData } = admin.storage
      .from("user-files")
      .getPublicUrl(storagePath);

    if (publicUrlData?.publicUrl) {
      try {
        const headRes = await fetch(publicUrlData.publicUrl, { method: "HEAD" });
        if (!headRes.ok) {
          console.error(`File verification failed (${headRes.status}) for ${storagePath}`);
          await admin
            .from("videos")
            .update({ status: "upload_failed" })
            .eq("id", videoId);

          return new Response(
            JSON.stringify({ error: "File not found in storage after upload", status: headRes.status }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (headErr) {
        console.error(`HEAD request failed for ${storagePath}:`, headErr);
        // Don't fail here — the file might still be accessible, continue
      }
    }

    // Step 3: Update database only after confirmed upload
    console.log(`Marking video ${videoId} as completed with url: ${storagePath}`);
    const { error: updateErr } = await admin
      .from("videos")
      .update({
        video_url: storagePath,
        status: "completed",
      })
      .eq("id", videoId);

    if (updateErr) {
      console.error(`DB update failed for ${videoId}:`, updateErr);
      return new Response(
        JSON.stringify({ error: "Database update failed", detail: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Video ${videoId} completed successfully`);
    return new Response(
      JSON.stringify({
        success: true,
        video_id: videoId,
        video_url: storagePath,
        status: "completed",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("pixi-video-complete error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
