import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mascot from "@/assets/pixi-mascot.png";

const PluginAuthPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const hasRedirected = useRef(false);

  // If already logged in, complete the auth flow
  useEffect(() => {
    if (user && sessionId && !success && !error && !loading) {
      completeAuth();
    }
  }, [user, sessionId, success, error, loading]);

  // If NOT logged in and not loading, auto-redirect to Google OAuth
  useEffect(() => {
    if (!authLoading && !user && sessionId && !hasRedirected.current) {
      hasRedirected.current = true;
      redirectToGoogle();
    }
  }, [authLoading, user, sessionId]);

  const redirectToGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/plugin-auth?session=${sessionId}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const completeAuth = async () => {
    if (!user || !sessionId) return;

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        throw new Error('No active session');
      }

      // Store auth session in database for plugin to poll (upsert to avoid duplicates)
      const { error: upsertError } = await supabase
        .from('plugin_auth_sessions')
        .upsert({
          session_id: sessionId,
          user_id: user.id,
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          authenticated: true,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        }, {
          onConflict: 'session_id',
        });

      if (upsertError) throw upsertError;

      setSuccess(true);
      toast({
        title: "Success!",
        description: "You can now close this window and return to the plugin."
      });
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Failed to complete authentication');
    } finally {
      setLoading(false);
    }
  };

  // No session ID
  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card variant="glass" className="p-8 max-w-md text-center">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid Request</h1>
          <p className="text-muted-foreground">
            This page must be opened from the Pixibot plugin.
          </p>
        </Card>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden px-4">
        <div className="absolute inset-0 animate-gradient-mesh bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <img src={mascot} alt="Pixi" className="fixed bottom-8 left-8 h-16 w-16 animate-float opacity-60 hidden md:block z-10" />

        <Card variant="glass" className="p-8 max-w-md text-center relative z-10 shadow-luxury-lg">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-cal-sans mb-2">Authentication Complete!</h1>
          <p className="text-muted-foreground mb-6">
            You can now close this window and return to the plugin.
          </p>
          <p className="text-sm text-muted-foreground/60">
            The plugin will update automatically.
          </p>
        </Card>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card variant="glass" className="p-8 max-w-md text-center">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => { setError(''); hasRedirected.current = false; }}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Try Again
          </button>
        </Card>
      </div>
    );
  }

  // Loading / Redirecting to Google
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute inset-0 animate-gradient-mesh bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <img src={mascot} alt="Pixi" className="fixed bottom-8 left-8 h-16 w-16 animate-float opacity-60 hidden md:block z-10" />

      <Card variant="glass" className="p-8 max-w-md text-center relative z-10">
        <img src={mascot} alt="Pixi" className="h-12 w-12 mx-auto mb-4" />
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Redirecting to Google...</h1>
        <p className="text-sm text-muted-foreground">
          Please wait while we redirect you to sign in.
        </p>
      </Card>
    </div>
  );
};

export default PluginAuthPage;
