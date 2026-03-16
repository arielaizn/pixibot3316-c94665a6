import { useState, useEffect } from "react";
import { useDirection } from "@/contexts/DirectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link2, Globe, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FileShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName?: string;
}

const FileShareModal = ({ open, onOpenChange, fileId, fileName }: FileShareModalProps) => {
  const { t } = useDirection();
  const { user } = useAuth();
  const [visibility, setVisibility] = useState("private");
  const [copied, setCopied] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const [existingShareToken, setExistingShareToken] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user || !fileId) return;
    setLoadingState(true);
    (async () => {
      const { data } = await supabase
        .from("file_shares")
        .select("*")
        .eq("shared_by", user.id)
        .eq("file_id", fileId)
        .is("shared_with_email", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setVisibility(data[0].visibility);
        setExistingShareToken(data[0].share_token);
      } else {
        setVisibility("private");
        setExistingShareToken(null);
      }
      setLoadingState(false);
    })();
  }, [open, fileId, user]);

  const generateShareLink = async () => {
    if (!user) return null;

    if (existingShareToken) {
      await supabase
        .from("file_shares")
        .update({ visibility })
        .eq("share_token", existingShareToken);
      return `${window.location.origin}/share/file/${existingShareToken}`;
    }

    const { data, error } = await supabase
      .from("file_shares")
      .insert({
        file_id: fileId,
        shared_by: user.id,
        visibility: visibility === "private" ? "link" : visibility,
        permission: "viewer",
      })
      .select("share_token")
      .single();

    if (error || !data) {
      toast.error(t("share.errorCreate"));
      return null;
    }
    setExistingShareToken(data.share_token);
    setVisibility(visibility === "private" ? "link" : visibility);
    return `${window.location.origin}/share/file/${data.share_token}`;
  };

  const handleVisibilityChange = async (v: string) => {
    setVisibility(v);
    if (existingShareToken && user) {
      await supabase.from("file_shares").update({ visibility: v }).eq("share_token", existingShareToken);
    }
  };

  const handleCopyLink = async () => {
    const link = await generateShareLink();
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(t("share.copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t("share.title")}{fileName ? ` — ${fileName}` : ""}
          </DialogTitle>
        </DialogHeader>

        {loadingState ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("share.visibility")}</label>
              <div className="flex gap-2">
                {([
                  { v: "private", icon: Lock, label: t("share.private") },
                  { v: "link", icon: Link2, label: t("share.link") },
                  { v: "public", icon: Globe, label: t("share.public") },
                ] as const).map(({ v, icon: Icon, label }) => (
                  <button
                    key={v}
                    onClick={() => handleVisibilityChange(v)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                      visibility === v
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleCopyLink} className="w-full rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t("share.copied") : t("share.copyLink")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FileShareModal;
