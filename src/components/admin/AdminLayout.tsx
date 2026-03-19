import { ReactNode } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import {
  LayoutDashboard, Users, CreditCard, Film, FolderOpen, MessageCircle, Shield, LogOut, Loader2, Menu, Gift, BarChart3, Bell, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const navItems = [
  { path: "/admin/dashboard", icon: LayoutDashboard, labelKey: "admin.nav.dashboard" as const },
  { path: "/admin/users", icon: Users, labelKey: "admin.nav.users" as const },
  { path: "/admin/subscriptions", icon: CreditCard, labelKey: "admin.nav.subscriptions" as const },
  { path: "/admin/credits", icon: CreditCard, labelKey: "admin.nav.credits" as const },
  { path: "/admin/videos", icon: Film, labelKey: "admin.nav.videos" as const },
  { path: "/admin/projects", icon: FolderOpen, labelKey: "admin.nav.projects" as const },
  { path: "/admin/whatsapp", icon: MessageCircle, labelKey: "admin.nav.whatsapp" as const },
  { path: "/admin/referrals", icon: Gift, labelKey: "admin.nav.referrals" as const },
  { path: "/admin/user-stats", icon: BarChart3, labelKey: "admin.nav.userStats" as const },
  { path: "/admin/updates", icon: Bell, labelKey: "admin.nav.updates" as const },
  { path: "/admin/admins", icon: ShieldCheck, labelKey: "admin.nav.admins" as const },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading } = useAdminAuth();
  const { signOut } = useAuth();
  const { t, isRTL } = useDirection();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin" replace />;
  if (!isAdmin) return <Navigate to="/not-admin" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`fixed inset-y-0 z-30 flex w-64 flex-col border-e border-border bg-card transition-transform duration-200 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"
        } ${isRTL ? "right-0" : "left-0"}`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Pixi Admin</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <p className="mb-2 truncate text-xs text-muted-foreground">{user.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {t("admin.signOut")}
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">
            {t("admin.title")}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
