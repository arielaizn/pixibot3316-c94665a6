import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDirection } from "@/contexts/DirectionContext";
import { getVideoPublicUrl } from "@/lib/videoUrl";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import { X, Trophy, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ChallengeData {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  details_url: string | null;
}

const SESSION_KEY = "pixi_challenge_seen";

const ChallengePopup = () => {
  const { isRTL } = useDirection();
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const fetchChallenge = async () => {
      const { data, error } = await supabase
        .from("challenges" as any)
        .select("id, title, description, video_url, details_url")
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data && (data as any[]).length > 0) {
        setChallenge((data as any[])[0] as ChallengeData);
        setVisible(true);
        sessionStorage.setItem(SESSION_KEY, "1");
      }
    };

    fetchChallenge();
  }, []);

  const close = () => setVisible(false);

  return (
    <AnimatePresence>
      {visible && challenge && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-primary/30 bg-card shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
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
            {challenge.video_url && (
              <div className="w-full">
                <PixiVideoPlayer src={getVideoPublicUrl(challenge.video_url)} title={challenge.title} />
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-4" dir={isRTL ? "rtl" : "ltr"}>
              {/* Trophy badge */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-primary">
                    {isRTL ? "אתגר פעיל!" : "Active Challenge!"}
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground">{challenge.title}</h2>
              {challenge.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{challenge.description}</p>
              )}

              {/* Details link button */}
              {challenge.details_url && (
                <Button
                  variant="luxury"
                  className="w-full gap-2 shadow-luxury-md"
                  onClick={() => window.open(challenge.details_url!, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  {isRTL ? "למידע נוסף" : "Learn More"}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChallengePopup;
