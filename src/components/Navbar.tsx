import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Moon, Sun, ChevronDown, LogOut, LayoutDashboard, FolderOpen, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import mascot from "@/assets/pixi-mascot.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const guestLinks = [
    { label: "בית", href: "/" },
    { label: "מחירים", href: "/pricing" },
    { label: "התחברות", href: "/login" },
    { label: "הרשמה", href: "/signup" },
  ];

  const authLinks = [
    { label: "דשבורד", href: "/dashboard", icon: LayoutDashboard },
    { label: "פרויקטים", href: "/projects", icon: FolderOpen },
    { label: "שדרוג", href: "/pricing", icon: Sparkles },
  ];

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";
  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const initials = userName.charAt(0).toUpperCase() || "U";

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={mascot} alt="Pixi" className="h-10 w-10" />
          <span className="text-xl font-bold text-foreground">Pixi</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-5 md:flex">
          {!user &&
            guestLinks.map((link) => (
              <Link key={link.href} to={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}

          {user &&
            authLinks.map((link) => (
              <Link key={link.href} to={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}

          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </button>

          {!user && (
            <Button asChild className="rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
              <Link to="/signup">התחל עכשיו</Link>
            </Button>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={avatarUrl} alt={userName} />
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="max-w-[100px] truncate">{userName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
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
                  התנתק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-full p-2 text-muted-foreground">
            <Sun className="h-5 w-5 dark:hidden" />
            <Moon className="hidden h-5 w-5 dark:block" />
          </button>
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
                <Link to="/signup" onClick={() => setOpen(false)}>התחל עכשיו</Link>
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
                התנתק
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
