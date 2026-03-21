import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Moon, Sun, Globe, ChevronDown, LogOut, LayoutDashboard, FolderOpen, Sparkles, Film } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useDirection } from "@/contexts/DirectionContext";
import mascot from "@/assets/pixi-mascot.png";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Toggle theme"
    >
      {isDark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
    </button>
  );
};

const DirectionToggle = () => {
  const { toggleDirection } = useDirection();

  return (
    <button
      onClick={toggleDirection}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Toggle language"
    >
      <Globe className="h-[18px] w-[18px]" />
    </button>
  );
};

const LangIndicator = () => {
  const { isRTL } = useDirection();

  return (
    <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-muted px-2 text-xs font-bold text-muted-foreground">
      {isRTL ? "HE" : "EN"}
    </span>
  );
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { t } = useDirection();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const guestLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.pricing"), href: "/pricing" },
    { label: t("nav.login"), href: "/login" },
    { label: t("nav.signup"), href: "/signup" },
  ];

  const authLinks = [
    { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("nav.projects"), href: "/projects", icon: FolderOpen },
    { label: t("nav.upgrade"), href: "/pricing", icon: Sparkles },
  ];

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";
  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const initials = userName.charAt(0).toUpperCase() || "U";

  return (
    <nav className="sticky top-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl shadow-luxury-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        {/* Logo with animation */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.img
            src={mascot}
            alt="Pixi"
            className="h-12 w-12 transition-transform group-hover:scale-110"
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          />
          <span className="text-2xl font-bold text-foreground">Pixi</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-4 md:flex">
          {!user &&
            guestLinks.map((link) => (
              <Link key={link.href} to={link.href} className="nav-link pb-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}

          {user &&
            authLinks.map((link) => (
              <Link key={link.href} to={link.href} className="nav-link pb-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}

          {/* Controls group: 🌙 | 🌐 | EN */}
          <div className="flex items-center gap-1 border-s border-border ps-3">
            <ThemeToggle />
            <DirectionToggle />
            <LangIndicator />
          </div>

          {!user && (
            <Button asChild variant="luxury" size="default" className="rounded-full">
              <Link to="/signup">{t("nav.getStarted")}</Link>
            </Button>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-card/70 hover:border-primary/30 hover:shadow-luxury-sm">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={avatarUrl} alt={userName} />
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="max-w-[100px] truncate">{userName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-luxury border-border/50 bg-card/90 backdrop-blur-xl shadow-luxury-lg">
                {authLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild className="cursor-pointer gap-2">
                    <Link to={link.href}>
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <DirectionToggle />
          <LangIndicator />
          <button onClick={() => setOpen(!open)} className="p-2 text-foreground">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          {!user && (
            <>
              {guestLinks.map((link) => (
                <Link key={link.href} to={link.href} onClick={() => setOpen(false)} className="block py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              ))}
              <Button asChild className="mt-2 w-full rounded-full bg-primary font-semibold text-primary-foreground">
                <Link to="/signup" onClick={() => setOpen(false)}>{t("nav.getStarted")}</Link>
              </Button>
            </>
          )}

          {user && (
            <>
              <div className="flex items-center gap-3 border-b border-border py-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="truncate font-medium text-foreground">{userName}</span>
              </div>
              {authLinks.map((link) => (
                <Link key={link.href} to={link.href} onClick={() => setOpen(false)} className="flex items-center gap-2 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { setOpen(false); handleSignOut(); }}
                className="flex w-full items-center gap-2 py-3 text-sm font-medium text-destructive"
              >
                <LogOut className="h-4 w-4" />
                {t("nav.logout")}
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
