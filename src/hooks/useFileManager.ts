import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface UserFolder {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
  is_deleted: boolean;
}

export interface UserFile {
  id: string;
  user_id: string;
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

export function useFileManager(currentFolderId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const foldersQuery = useQuery({
    queryKey: ["user-folders", user?.id, currentFolderId],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("user_folders")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_deleted", false)
        .order("name");

      if (currentFolderId) {
        query = query.eq("parent_id", currentFolderId);
      } else {
        query = query.is("parent_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as UserFolder[];
    },
  });

  const filesQuery = useQuery({
    queryKey: ["user-files", user?.id, currentFolderId],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("user_files")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (currentFolderId) {
        query = query.eq("folder_id", currentFolderId);
      } else {
        query = query.is("folder_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as UserFile[];
    },
  });

  const allFilesQuery = useQuery({
    queryKey: ["user-files-all", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_files")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as UserFile[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["user-folders"] });
    qc.invalidateQueries({ queryKey: ["user-files"] });
    qc.invalidateQueries({ queryKey: ["user-files-all"] });
  };

  const createFolder = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("user_folders").insert({
        user_id: user!.id,
        parent_id: currentFolderId,
        name,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const renameFolder = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("user_folders").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_folders").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const uploadFiles = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        const path = `${user!.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("user-files")
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("user-files").getPublicUrl(path);

        const { error: dbError } = await supabase.from("user_files").insert({
          user_id: user!.id,
          folder_id: currentFolderId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type || "unknown",
          file_size: file.size,
        });

        if (dbError) throw dbError;
      }
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "הקבצים הועלו בהצלחה" });
    },
    onError: (err: any) => {
      toast({ title: "שגיאה בהעלאה", description: err.message, variant: "destructive" });
    },
  });

  const renameFile = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("user_files").update({ file_name: name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const deleteFile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_files").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const toggleStar = useMutation({
    mutationFn: async ({ id, starred }: { id: string; starred: boolean }) => {
      const { error } = await supabase.from("user_files").update({ is_starred: starred }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const moveFile = useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string | null }) => {
      const { error } = await supabase.from("user_files").update({ folder_id: folderId }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  return {
    folders: foldersQuery.data || [],
    files: filesQuery.data || [],
    allFiles: allFilesQuery.data || [],
    loading: foldersQuery.isLoading || filesQuery.isLoading,
    createFolder,
    renameFolder,
    deleteFolder,
    uploadFiles,
    renameFile,
    deleteFile,
    toggleStar,
    moveFile,
  };
}
