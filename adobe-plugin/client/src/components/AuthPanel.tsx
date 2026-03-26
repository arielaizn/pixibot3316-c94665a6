import { useState, useEffect, useRef } from 'react';

const SUPABASE_URL = 'https://ymhcczxxrgcnyxaqmohj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaGNjenh4cmdjbnl4YXFtb2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTc1ODEsImV4cCI6MjA1MDUzMzU4MX0.pqOSe4K9wJvBKj7DKTp2HcJzJrF9g5Scu5dv_fXWXkE';

interface AuthPanelProps {
  onAuthenticated: () => void;
}

export default function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);
  const sessionIdRef = useRef('');

  // Generate unique session ID
  const generateSessionId = () => {
    return `plugin_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  // Handle Google OAuth via browser
  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');

    // Generate session ID
    const newSessionId = generateSessionId();
    sessionIdRef.current = newSessionId;

    // Open browser to plugin auth page
    const authUrl = `https://pixibot.app/plugin-auth?session=${newSessionId}`;

    // Open in system browser using CEP
    try {
      if (typeof (window as any).cep !== 'undefined') {
        (window as any).cep.util.openURLInDefaultBrowser(authUrl);
      } else {
        window.open(authUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to open browser:', err);
    }

    // Start polling
    setPolling(true);
  };

  // Poll for authentication token using direct REST API
  useEffect(() => {
    if (!polling || !sessionIdRef.current) return;

    const currentSessionId = sessionIdRef.current;

    const pollForToken = async () => {
      try {
        // Use Edge Function - no CORS issues
        const url = `${SUPABASE_URL}/functions/v1/pixi-plugin-auth-check?session_id=${currentSessionId}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });

        if (!response.ok) {
          console.error('Poll response error:', response.status);
          return;
        }

        const data = await response.json();

        if (data && data.authenticated && data.access_token) {
          // Store session
          localStorage.setItem('pixibot_session', JSON.stringify({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: { id: data.user_id },
          }));

          // Stop polling and notify parent
          setPolling(false);
          setLoading(false);
          onAuthenticated();
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Poll immediately, then every 2 seconds
    pollForToken();
    const pollInterval = setInterval(pollForToken, 2000);

    // Cleanup after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setPolling(false);
      setLoading(false);
      setError('Authentication timeout. Please try again.');
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [polling, onAuthenticated]);

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 animate-gradient-mesh bg-gradient-to-br from-primary/10 via-background to-accent/10" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">P</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Pixi</span>
          </div>
        </div>

        {/* Glass Card */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 rounded-2xl shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">
              {polling ? 'Waiting for authentication...' : 'Sign in to access your projects'}
            </p>
          </div>

          {polling ? (
            // Polling State
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-primary/20 animate-pulse" />
                  <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  Complete authentication in your browser...
                </p>
                <p className="mt-2 text-xs text-muted-foreground/60 text-center">
                  This window will update automatically
                </p>
              </div>

              <button
                onClick={() => {
                  setPolling(false);
                  setLoading(false);
                  sessionIdRef.current = '';
                }}
                className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            // Login Button
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-card hover:bg-accent border-2 border-border hover:border-primary rounded-xl font-medium text-foreground transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-base">Continue with Google</span>
              </button>

              {error && (
                <div className="text-sm text-red-500 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/20">
                  {error}
                </div>
              )}

              <div className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  By signing in, you agree to our{' '}
                  <a href="https://pixibot.app/terms" className="text-primary hover:underline">
                    Terms of Service
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Plugin version 1.0.0 • Adobe Premiere Pro & After Effects
          </p>
        </div>
      </div>
    </div>
  );
}
