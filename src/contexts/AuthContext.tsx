import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { attributeReferralSignup } from "@/hooks/useReferral";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we're on /auth/callback (with or without ?code= still in the URL),
    // we're in a PKCE OAuth callback. Keep loading=true until SIGNED_IN fires
    // (or timeout), so no page sees loading=false with user=null and redirects
    // to /login before the exchange completes.
    // NOTE: we check pathname (not just ?code=) because Supabase can strip the
    // code param via history.replaceState before this useEffect runs.
    const urlParams = new URLSearchParams(window.location.search);
    const isCallbackRoute = window.location.pathname === "/auth/callback";
    const isPkceCallback =
      (isCallbackRoute || urlParams.has("code")) && !urlParams.has("error");

    let pkceTimeout: ReturnType<typeof setTimeout> | null = null;
    if (isPkceCallback) {
      // Safety valve: if SIGNED_IN never fires, stop blocking after 15s
      pkceTimeout = setTimeout(() => setLoading(false), 15000);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // During PKCE callback: INITIAL_SESSION fires first with null session.
      // Ignore it — wait for the real SIGNED_IN event.
      if (isPkceCallback && event === "INITIAL_SESSION" && !session) {
        return;
      }

      // Clear PKCE timeout now that we have a definitive event
      if (pkceTimeout) {
        clearTimeout(pkceTimeout);
        pkceTimeout = null;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        const pending = localStorage.getItem("pixi_pending_whatsapp");
        if (pending) {
          localStorage.removeItem("pixi_pending_whatsapp");
          await supabase
            .from("profiles")
            .update({ whatsapp_number: pending })
            .eq("user_id", session.user.id);
        }

        const refCode = localStorage.getItem("pixi_referral_code");
        if (refCode) {
          localStorage.removeItem("pixi_referral_code");
          try {
            await attributeReferralSignup(refCode, session.user.id);
          } catch (e) {
            console.log("Referral attribution:", e);
          }
        }
      }
    });

    // For non-PKCE pages: resolve session immediately via getSession()
    if (!isPkceCallback) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
    }

    return () => {
      subscription.unsubscribe();
      if (pkceTimeout) clearTimeout(pkceTimeout);
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
