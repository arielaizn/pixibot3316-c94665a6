import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Moon, Sun, Globe, ChevronDown, LogOut, LayoutDashboard, FolderOpen, Sparkles } from "lucide-react";
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
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-primary/10 hover:text-foreground"
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
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-primary/10 hover:text-foreground"
      aria-label="Toggle language"
    >
      <Globe className="h-[18px] w-[18px]" />
    </button>
  );
};

const LangIndicator = () => {
  const { isRTL } = useDirection();

  return (
    <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
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
    <nav className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-md shadow-luxury-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img src={mascot} alt="Pixi" className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-xl font-extrabold gradient-text">Pixi</span>
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

          {/* Controls group */}
          <div className="flex items-center gap-1 border-s border-border/30 ps-3">
            <ThemeToggle />
            <DirectionToggle />
            <LangIndicator />
          </div>

          {!user && (
            <Button asChild variant="luxury" className="rounded-full px-6">
              <Link to="/signup">{t("nav.getStarted")}</Link>
            </Button>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border-2 border-border/50 bg-card/95 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:shadow-luxury-md">
                  <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                    <AvatarImage src={avatarUrl} alt={userName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-xs font-bold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="max-w-[100px] truncate">{userName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-luxury-lg border-2 border-border/50 shadow-luxury-lg">
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
        <div className="border-t border-border/30 bg-background/95 backdrop-blur-md px-4 pb-4 md:hidden">
          {!user && (
            <>
              {guestLinks.map((link) => (
                <Link key={link.href} to={link.href} onClick={() => setOpen(false)} className="block py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              ))}
              <Button asChild variant="luxury" className="mt-2 w-full rounded-full">
                <Link to="/signup" onClick={() => setOpen(false)}>{t("nav.getStarted")}</Link>
              </Button>
            </>
          )}

          {user && (
            <>
              <div className="flex items-center gap-3 border-b border-border/30 py-3">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-sm font-bold text-primary">{initials}</AvatarFallback>
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
