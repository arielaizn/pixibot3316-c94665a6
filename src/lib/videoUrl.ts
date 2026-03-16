import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves a video_url value (Supabase storage path) into a streamable public URL.
 * If the value is already a full URL (http/https), it is returned as-is.
 * Returns empty string for null/undefined/empty inputs.
 */
export function getVideoPublicUrl(videoUrl: string | null | undefined): string {
  if (!videoUrl || !videoUrl.trim()) return "";

  // Already a full URL — return as-is
  if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
    return videoUrl;
  }

  // It's a storage path — resolve via Supabase storage
  const { data } = supabase.storage.from("user-files").getPublicUrl(videoUrl);
  return data?.publicUrl ? encodeURI(decodeURI(data.publicUrl)) : "";
}
