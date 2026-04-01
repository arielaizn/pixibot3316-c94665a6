import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * OAuth callback page for Supabase PKCE flow.
 * Google redirects here after authentication with ?code=... in the URL.
 * Supabase auto-exchanges the code; we wait for SIGNED_IN then redirect.
 * Also handles ?error=... redirects from Supabase when exchange fails.
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // If Supabase returned an error (e.g. Unable to exchange external code),
    // send the user back to login immediately.
    const error = searchParams.get("error");
    if (error) {
      navigate("/login", { replace: true });
      return;
    }

    // onAuthStateChange fires SIGNED_IN once the PKCE code is exchanged
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        subscription.unsubscribe();
        navigate("/dashboard", { replace: true });
      } else if (event === "INITIAL_SESSION" && session) {
        subscription.unsubscribe();
        navigate("/dashboard", { replace: true });
      }
    });

    // Fallback: if getSession resolves with a user, navigate directly
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        navigate("/dashboard", { replace: true });
      }
    });

    // Safety timeout: if nothing happens in 10s, send to login
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      navigate("/login", { replace: true });
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
};

export default AuthCallbackPage;
