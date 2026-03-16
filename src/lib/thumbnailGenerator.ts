import { supabase } from "@/integrations/supabase/client";

/**
 * Extract a frame from a video URL at the given time (seconds) using a hidden
 * <video> + <canvas>. Returns a Blob (JPEG).
 */
function extractFrame(videoUrl: string, timeSeconds = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };

    video.addEventListener("loadedmetadata", () => {
      // Clamp seek time to video duration
      const seekTo = Math.min(timeSeconds, video.duration * 0.1 || 1);
      video.currentTime = seekTo;
    });

    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) resolve(blob);
            else reject(new Error("Canvas toBlob returned null"));
          },
          "image/jpeg",
          0.85
        );
      } catch (e) {
        cleanup();
        reject(e);
      }
    });

    video.addEventListener("error", () => {
      cleanup();
      reject(new Error("Video load error"));
    });

    // Timeout after 15s
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Thumbnail extraction timeout"));
    }, 15000);

    video.addEventListener("seeked", () => clearTimeout(timer), { once: true });

    video.src = videoUrl;
  });
}

/**
 * Generate a thumbnail for a video, upload it to storage, and update the
 * video record. Returns the public thumbnail URL or null on failure.
 */
export async function generateThumbnail(
  videoId: string,
  videoUrl: string,
  userId: string
): Promise<string | null> {
  try {
    const blob = await extractFrame(videoUrl, 1);

    const path = `${userId}/thumbnails/${videoId}_${Date.now()}.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from("user-files")
      .upload(path, blob, { contentType: "image/jpeg", upsert: true });

    if (uploadErr) {
      console.error("Thumbnail upload error:", uploadErr);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("user-files")
      .getPublicUrl(path);

    const thumbnailUrl = urlData.publicUrl;

    const { error: updateErr } = await supabase
      .from("videos")
      .update({ thumbnail_url: thumbnailUrl })
      .eq("id", videoId);

    if (updateErr) {
      console.error("Thumbnail DB update error:", updateErr);
      return null;
    }

    return thumbnailUrl;
  } catch (e) {
    // Silently fail — CORS or codec issues are expected for external URLs
    console.warn("Thumbnail generation failed:", (e as Error).message);
    return null;
  }
}
