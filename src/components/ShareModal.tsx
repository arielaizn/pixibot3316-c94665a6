import { useState, useEffect } from "react";
import { useDirection } from "@/contexts/DirectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Mail, Check, Link2, Globe, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  videoId?: string;
  projectName?: string;
}

const ShareModal = ({ open, onOpenChange, projectId, videoId, projectName }: ShareModalProps) => {
  const { t } = useDirection();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("viewer");
  const [visibility, setVisibility] = useState("private");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const [existingShareToken, setExistingShareToken] = useState<string | null>(null);

  // Load existing share state when modal opens
  useEffect(() => {
    if (!open || !user) return;
    setLoadingState(true);
    (async () => {
      const query = supabase
        .from("project_shares")
        .select("*")
        .eq("project_id", projectId)
        .eq("shared_by", user.id)
        .is("shared_with_email", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (videoId) {
        query.eq("video_id", videoId);
      } else {
        query.is("video_id", null);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        setVisibility(data[0].visibility);
        setPermission(data[0].permission);
        setExistingShareToken(data[0].share_token);
      } else {
        setVisibility("private");
        setExistingShareToken(null);
      }
      setLoadingState(false);
    })();
  }, [open, projectId, videoId, user]);

  const generateShareLink = async () => {
    if (!user) return null;

    // If we already have a token, reuse it (update visibility)
    if (existingShareToken) {
      await supabase
        .from("project_shares")
        .update({ visibility, permission })
        .eq("share_token", existingShareToken);

      const base = window.location.origin;
      const type = videoId ? "video" : "project";
      return `${base}/share/${type}/${existingShareToken}`;
    }

    const { data, error } = await supabase
      .from("project_shares")
      .insert({
        project_id: projectId,
        video_id: videoId || null,
        shared_by: user.id,
        visibility,
        permission,
      })
      .select("share_token")
      .single();

    if (error || !data) {
      toast.error(t("share.errorCreate"));
      return null;
    }
    setExistingShareToken(data.share_token);
    const base = window.location.origin;
    const type = videoId ? "video" : "project";
    return `${base}/share/${type}/${data.share_token}`;
  };

  // Persist visibility changes
  const handleVisibilityChange = async (v: string) => {
    setVisibility(v);
    if (existingShareToken && user) {
      await supabase
        .from("project_shares")
        .update({ visibility: v })
        .eq("share_token", existingShareToken);
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

  const handleInvite = async () => {
    if (!email.trim() || !user) return;
    setSending(true);
    const { error } = await supabase
      .from("project_shares")
      .insert({
        project_id: projectId,
        video_id: videoId || null,
        shared_by: user.id,
        shared_with_email: email.trim(),
        visibility: "private",
        permission,
      });
    setSending(false);
    if (error) {
      toast.error(t("share.errorInvite"));
    } else {
      toast.success(t("share.inviteSent"));
      setEmail("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t("share.title")}{projectName ? ` — ${projectName}` : ""}
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

            <Button
              onClick={handleCopyLink}
              className="w-full rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t("share.copied") : t("share.copyLink")}
            </Button>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("share.inviteEmail")}</label>
              <div className="flex gap-2">
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("share.emailPlaceholder")}
                  className="rounded-xl flex-1"
                  type="email"
                />
                <Select value={permission} onValueChange={setPermission}>
                  <SelectTrigger className="w-28 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">{t("share.viewer")}</SelectItem>
                    <SelectItem value="commenter">{t("share.commenter")}</SelectItem>
                    <SelectItem value="editor">{t("share.editor")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleInvite}
                disabled={!email.trim() || sending}
                className="w-full rounded-xl gap-2"
                variant="outline"
              >
                <Mail className="h-4 w-4" />
                {t("share.send")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
