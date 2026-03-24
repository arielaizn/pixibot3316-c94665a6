import { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

  // If already logged in, complete the auth flow
  useEffect(() => {
    if (user && sessionId && !success && !error) {
      completeAuth();
    }
  }, [user, sessionId, success, error]);

  const completeAuth = async () => {
    if (!user || !sessionId) return;

    setLoading(true);

    try {
      // Get current session
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
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        }, {
          onConflict: 'session_id',
        });

      if (upsertError) throw upsertError;

      setSuccess(true);
      toast({
        title: "✅ Success!",
        description: "You can now close this window and return to the plugin."
      });
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Failed to complete authentication');
      toast({
        title: "Error",
        description: err.message || 'Failed to complete authentication',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/plugin-auth?session=${sessionId}`,
      },
    });

    if (error) {
      toast({
        title: "Login Error",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  // Show error if no session ID
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

  // Show loading during initial auth check
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show success message
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden px-4">
        {/* Gradient Background */}
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

  // Show error message
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card variant="glass" className="p-8 max-w-md text-center">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="luxury" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // Show login page if not authenticated
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden px-4 py-12">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 animate-gradient-mesh bg-gradient-to-br from-primary/10 via-background to-accent/10" />

      <img src={mascot} alt="Pixi" className="fixed bottom-8 left-8 h-16 w-16 animate-float opacity-60 hidden md:block z-10" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            <img src={mascot} alt="Pixi" className="h-10 w-10" />
            <span className="text-2xl font-bold text-foreground">Pixi</span>
          </div>
        </div>

        <Card variant="glass" className="p-8 shadow-luxury-lg rounded-luxury-lg animate-luxury-fade-up">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-cal-sans text-foreground">Plugin Authentication</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to connect your Pixibot account to the Adobe plugin
            </p>
          </div>

          <Button
            variant="luxury-outline"
            className="mb-6 w-full gap-3 py-6 text-base font-medium"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              This will open in a new window
            </p>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PluginAuthPage;
