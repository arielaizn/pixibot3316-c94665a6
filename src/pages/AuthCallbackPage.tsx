import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * OAuth callback page for Supabase PKCE flow.
 *
 * When Google redirects here with ?code=..., AuthContext keeps loading=true
 * until the PKCE exchange completes and SIGNED_IN fires. We simply wait for
 * loading=false, then navigate based on whether user is set.
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Handle error params returned by Supabase (e.g. exchange failure)
  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Once AuthContext resolves (loading=false), navigate to the right place
  useEffect(() => {
    if (!loading) {
      navigate(user ? "/dashboard" : "/login", { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
};

export default AuthCallbackPage;
