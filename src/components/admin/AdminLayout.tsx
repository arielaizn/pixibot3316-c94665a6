import { ReactNode } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import {
  LayoutDashboard, Users, CreditCard, Film, FolderOpen, MessageCircle, Shield, LogOut, Loader2, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const navItems = [
  { path: "/admin/dashboard", icon: LayoutDashboard, labelHe: "דשבורד", labelEn: "Dashboard" },
  { path: "/admin/users", icon: Users, labelHe: "משתמשים", labelEn: "Users" },
  { path: "/admin/subscriptions", icon: CreditCard, labelHe: "מנויים", labelEn: "Subscriptions" },
  { path: "/admin/credits", icon: CreditCard, labelHe: "קרדיטים", labelEn: "Credits" },
  { path: "/admin/videos", icon: Film, labelHe: "סרטונים", labelEn: "Videos" },
  { path: "/admin/projects", icon: FolderOpen, labelHe: "פרויקטים", labelEn: "Projects" },
  { path: "/admin/whatsapp", icon: MessageCircle, labelHe: "WhatsApp", labelEn: "WhatsApp" },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading } = useAdminAuth();
  const { signOut } = useAuth();
  const { isRTL } = useDirection();
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
      {/* Sidebar */}
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
                {isRTL ? item.labelHe : item.labelEn}
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
            {isRTL ? "התנתק" : "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">
            {isRTL ? "ניהול Pixi" : "Pixi Management"}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
