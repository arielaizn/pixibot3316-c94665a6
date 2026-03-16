import { useAuth } from "@/contexts/AuthContext";
import { useWhatsAppRequired } from "@/hooks/useWhatsAppRequired";
import WhatsAppNumberModal from "@/components/WhatsAppNumberModal";
import { useLocation } from "react-router-dom";

/**
 * Wrap authenticated routes with this to gate on WhatsApp number.
 * Admin routes and public routes are excluded.
 */
const WhatsAppGate = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { needsWhatsApp, refetch } = useWhatsAppRequired();
  const location = useLocation();

  // Don't gate admin routes, public routes, or unauthenticated users
  const isExcluded =
    !user ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/share") ||
    location.pathname === "/not-admin" ||
    location.pathname === "/" ||
    location.pathname === "/signup" ||
    location.pathname === "/login" ||
    location.pathname === "/pricing";

  if (!isExcluded && needsWhatsApp) {
    return (
      <>
        {children}
        <WhatsAppNumberModal onComplete={() => refetch()} />
      </>
    );
  }

  return <>{children}</>;
};

export default WhatsAppGate;
