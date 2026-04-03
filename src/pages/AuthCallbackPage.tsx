import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * OAuth callback page for Supabase PKCE flow.
 * Waits for AuthContext to confirm the session before navigating,
 * which avoids the race condition where DashboardPage sees user=null.
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const exchanged = useRef(false);

  // Step 1: Explicitly exchange the code for a session (PKCE)
  useEffect(() => {
    if (exchanged.current) return;

    const error = searchParams.get("error");
    if (error) {
      navigate("/login", { replace: true });
      return;
    }

    const code = searchParams.get("code");
    if (code && !exchanged.current) {
      exchanged.current = true;
      supabase.auth.exchangeCodeForSession(window.location.href).catch(() => {
        // If exchange fails, fall through to timeout → /login
      });
    }
  }, [searchParams, navigate]);

  // Step 2: Once AuthContext confirms user is set, navigate to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  // Step 3: Safety timeout — if nothing resolves in 12s, go to login
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!user) navigate("/login", { replace: true });
    }, 12000);
    return () => clearTimeout(timeout);
  }, [navigate, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
};

export default AuthCallbackPage;
