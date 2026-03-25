import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_SUBFOLDERS = ["final", "images", "animations", "music", "narration"] as const;
export type StorageCategory = (typeof STORAGE_SUBFOLDERS)[number];

export interface StorageFileItem {
  name: string;
  fullPath: string;
  publicUrl: string;
  category: StorageCategory;
  size: number | null;
  lastModified: string | null;
  mimeType: string;
}

function inferMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
    m4a: "audio/mp4", aac: "audio/aac",
  };
  return map[ext] || "application/octet-stream";
}

export function useStorageFiles(storagePath: string | null) {
  const query = useQuery({
    queryKey: ["storage-files", storagePath],
    enabled: !!storagePath,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!storagePath) return { final: [], images: [], animations: [], music: [], narration: [] };

      // Ensure trailing slash
      const basePath = storagePath.endsWith("/") ? storagePath : `${storagePath}/`;

      const result: Record<StorageCategory, StorageFileItem[]> = {
        final: [], images: [], animations: [], music: [], narration: [],
      };

      const listings = await Promise.all(
        STORAGE_SUBFOLDERS.map(async (folder) => {
          const prefix = `${basePath}${folder}`;
          const { data, error } = await supabase.storage
            .from("user-files")
            .list(prefix, { limit: 100, sortBy: { column: "name", order: "asc" } });

          if (error) {
            console.warn(`Storage list error for ${prefix}:`, error.message);
            return { folder, files: [] };
          }

          // Filter out placeholder files and folder entries (real files have an id)
          const files = (data || []).filter(
            (f) => f.name && !f.name.startsWith(".") && f.id
          );
          return { folder, files };
        })
      );

      for (const { folder, files } of listings) {
        result[folder] = files.map((f) => {
          const fullPath = `${basePath}${folder}/${f.name}`;
          const { data: urlData } = supabase.storage.from("user-files").getPublicUrl(fullPath);
          return {
            name: f.name,
            fullPath,
            publicUrl: urlData.publicUrl,
            category: folder,
            size: (f as any).metadata?.size ?? null,
            lastModified: (f as any).updated_at || (f as any).created_at || null,
            mimeType: inferMimeType(f.name),
          };
        });
      }

      return result;
    },
  });

  const data = query.data || { final: [], images: [], animations: [], music: [], narration: [] };
  const totalCount = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);

  return {
    ...data,
    totalCount,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
