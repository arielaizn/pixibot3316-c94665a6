import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * OAuth callback page for Supabase PKCE flow.
 *
 * Subscribes directly to Supabase auth events so it doesn't depend on
 * AuthContext.loading (which can have timing issues with the PKCE exchange).
 * On SIGNED_IN / INITIAL_SESSION with a user → /dashboard.
 * On error param → /login immediately.
 * Safety timeout: redirect to /login after 15 s if nothing fires.
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect immediately if Supabase returned an error param
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      navigate("/login", { replace: true });
      return;
    }

    // Subscribe directly to auth state so we catch SIGNED_IN reliably,
    // regardless of when AuthContext's own subscription fires.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Session established — go to dashboard
          navigate("/dashboard", { replace: true });
        } else if (event === "INITIAL_SESSION") {
          // PKCE exchange still in progress — wait for SIGNED_IN
        } else {
          // Any other event without a user means auth failed
          navigate("/login", { replace: true });
        }
      }
    );

    // Safety valve: if the exchange never completes, bail to login
    const timeout = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 15_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
    // navigate is stable — intentionally omitting to avoid re-running the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
};

export default AuthCallbackPage;
