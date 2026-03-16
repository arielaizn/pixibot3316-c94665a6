import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProjectWithVideos {
  id: string;
  name: string;
  status: string;
  created_at: string;
  user_id: string;
  videos: VideoRecord[];
}

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
}

export const useProjects = () => {
  const { user } = useAuth();

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
      if (projectIds.length > 0) {
        const { data: vids, error: vErr } = await supabase
          .from("videos")
          .select("*")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false });
        if (vErr) throw vErr;
        videos = (vids || []) as VideoRecord[];
      }

      // Also get orphan videos (no project)
      const { data: orphans } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", user!.id)
        .is("project_id", null)
        .order("created_at", { ascending: false });

      const orphanVideos = (orphans || []) as VideoRecord[];

      const mapped: ProjectWithVideos[] = (projects || []).map((p) => ({
        ...p,
        videos: videos.filter((v) => v.project_id === p.id),
      }));

      // Add virtual project for orphan videos
      if (orphanVideos.length > 0) {
        mapped.push({
          id: "__orphan__",
          name: "ללא פרויקט",
          status: "active",
          created_at: orphanVideos[0].created_at,
          user_id: user!.id,
          videos: orphanVideos,
        });
      }

      return mapped;
    },
  });

  return projectsQuery;
};
