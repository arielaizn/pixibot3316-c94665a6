import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { generateThumbnail } from "@/lib/thumbnailGenerator";

export interface VideoRecord {
  id: string;
  project_id: string | null;
  user_id: string;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
  status: string;
  credits_used: number;
  created_at: string;
  version_number: number;
  parent_video_id: string | null;
  category: string | null;
  tags: string[] | null;
  description: string | null;
  content_type: string | null;
}

export interface ProjectFile {
  id: string;
  user_id: string;
  project_id: string | null;
  folder_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  is_starred: boolean;
  is_deleted: boolean;
  visibility: string;
  created_at: string;
}

export interface ProjectWithContent {
  id: string;
  name: string;
  status: string;
  created_at: string;
  user_id: string;
  videos: VideoRecord[];
  files: ProjectFile[];
}

export const useProjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const projectsQuery = useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: projects, error: pErr } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (pErr) throw pErr;

      const projectIds = (projects || []).map((p) => p.id);

      let videos: VideoRecord[] = [];
      let projectFiles: ProjectFile[] = [];

      if (projectIds.length > 0) {
        const [vidsRes, filesRes] = await Promise.all([
          supabase
            .from("videos")
            .select("*")
            .in("project_id", projectIds)
            .order("created_at", { ascending: false }),
          supabase
            .from("user_files")
            .select("*")
            .in("project_id", projectIds)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false }),
        ]);
        if (vidsRes.error) throw vidsRes.error;
        if (filesRes.error) throw filesRes.error;
        videos = (vidsRes.data || []) as VideoRecord[];
        projectFiles = (filesRes.data || []) as ProjectFile[];
      }

      // Orphan videos
      const { data: orphans } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", user!.id)
        .is("project_id", null)
        .order("created_at", { ascending: false });

      const orphanVideos = (orphans || []) as VideoRecord[];

      const mapped: ProjectWithContent[] = (projects || []).map((p) => ({
        ...p,
        videos: videos.filter((v) => v.project_id === p.id),
        files: projectFiles.filter((f) => f.project_id === p.id),
      }));

      if (orphanVideos.length > 0) {
        mapped.push({
          id: "__orphan__",
          name: "ללא פרויקט",
          status: "active",
          created_at: orphanVideos[0].created_at,
          user_id: user!.id,
          videos: orphanVideos,
          files: [],
        });
      }

      return mapped;
    },
  });

  // Create project
  const createProject = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: user!.id, name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "פרויקט נוצר בהצלחה" });
    },
    onError: (err: any) => toast({ title: "שגיאה", description: err.message, variant: "destructive" }),
  });

  // Rename project
  const renameProject = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("projects").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  // Delete project
  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").update({ status: "deleted" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  // Rename video
  const renameVideo = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from("videos").update({ title }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  // Delete video
  const deleteVideo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("videos").update({ status: "deleted" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  // Upload files to a project
  const uploadToProject = useMutation({
    mutationFn: async ({ projectId, files: fileList }: { projectId: string; files: File[] }) => {
      const results: { progress: number }[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const path = `${user!.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("user-files")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("user-files").getPublicUrl(path);
        const { error: dbError } = await supabase.from("user_files").insert({
          user_id: user!.id,
          project_id: projectId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type || "unknown",
          file_size: file.size,
        });
        if (dbError) throw dbError;
        results.push({ progress: ((i + 1) / fileList.length) * 100 });
      }
      return results;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["user-files"] });
      toast({ title: "הקבצים הועלו בהצלחה" });
    },
    onError: (err: any) => toast({ title: "שגיאה בהעלאה", description: err.message, variant: "destructive" }),
  });

  // Move file to project
  const moveFileToProject = useMutation({
    mutationFn: async ({ fileId, projectId }: { fileId: string; projectId: string | null }) => {
      const { error } = await supabase.from("user_files").update({ project_id: projectId }).eq("id", fileId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["user-files"] });
    },
  });

  // Get version history for a video
  const useVideoVersions = (parentVideoId: string | null, videoId: string) => {
    return useQuery({
      queryKey: ["video-versions", parentVideoId || videoId],
      enabled: !!videoId,
      queryFn: async () => {
        const rootId = parentVideoId || videoId;
        const { data, error } = await supabase
          .from("videos")
          .select("*")
          .or(`id.eq.${rootId},parent_video_id.eq.${rootId}`)
          .order("version_number", { ascending: true });
        if (error) throw error;
        return (data || []) as VideoRecord[];
      },
    });
  };

  // Classify a video via AI
  const classifyVideo = useMutation({
    mutationFn: async (videoId: string) => {
      const { data, error } = await supabase.functions.invoke("pixi-classify", {
        body: { video_id: videoId },
      });
      if (error) throw error;
      return data as { category: string; tags: string[] };
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "הסרטון סווג בהצלחה" });
    },
    onError: (err: any) => toast({ title: "שגיאה בסיווג", description: err.message, variant: "destructive" }),
  });

  // Update video tags manually
  const updateVideoTags = useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { error } = await supabase.from("videos").update({ tags } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  // Update video category manually
  const updateVideoCategory = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string }) => {
      const { error } = await supabase.from("videos").update({ category } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  // Auto-generate thumbnails for completed videos without one
  const generatingRef = useRef<Set<string>>(new Set());
  const allVideos = (projectsQuery.data || []).flatMap((p) => p.videos);

  useEffect(() => {
    if (!user) return;
    const candidates = allVideos.filter(
      (v) =>
        v.video_url &&
        !v.thumbnail_url &&
        v.status === "completed" &&
        !generatingRef.current.has(v.id)
    );

    for (const v of candidates) {
      generatingRef.current.add(v.id);
      generateThumbnail(v.id, v.video_url!, user.id).then((url) => {
        if (url) invalidate();
      });
    }
  }, [allVideos, user]);

  return {
    ...projectsQuery,
    projects: projectsQuery.data || [],
    createProject,
    renameProject,
    deleteProject,
    renameVideo,
    deleteVideo,
    uploadToProject,
    moveFileToProject,
    useVideoVersions,
    classifyVideo,
    updateVideoTags,
    updateVideoCategory,
    invalidate,
  };
};
