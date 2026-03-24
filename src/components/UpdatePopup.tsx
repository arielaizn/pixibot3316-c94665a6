import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDirection } from "@/contexts/DirectionContext";
import { getVideoPublicUrl } from "@/lib/videoUrl";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import { X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UpdateData {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
}

const SESSION_KEY = "pixi_update_seen";

const UpdatePopup = () => {
  const { isRTL } = useDirection();
  const navigate = useNavigate();
  const [update, setUpdate] = useState<UpdateData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const fetchUpdate = async () => {
      const { data, error } = await supabase
        .from("updates" as any)
        .select("id, title, description, video_url")
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data && (data as any[]).length > 0) {
        setUpdate((data as any[])[0] as UpdateData);
        setVisible(true);
        sessionStorage.setItem(SESSION_KEY, "1");
      }
    };

    fetchUpdate();
  }, []);

  const close = () => setVisible(false);

  const goToUpdates = () => {
    close();
    navigate(`/updates/${update?.id}`);
  };

  return (
    <AnimatePresence>
      {visible && update && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-3 end-3 z-10 rounded-full bg-background/80 p-1.5 text-foreground hover:bg-background transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Video */}
            {update.video_url && (
              <div className="w-full">
                <PixiVideoPlayer src={getVideoPublicUrl(update.video_url)} title={update.title} />
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-3" dir={isRTL ? "rtl" : "ltr"}>
              <h2 className="text-xl font-bold text-foreground">{update.title}</h2>
              {update.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{update.description}</p>
              )}

              {/* Read More link */}
              <button
                onClick={goToUpdates}
                className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline transition-colors mt-2"
              >
                {isRTL ? "קרא עוד" : "Read More"}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdatePopup;
