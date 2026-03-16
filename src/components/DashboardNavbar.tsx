import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import mascot from "@/assets/pixi-mascot.png";

const DashboardNavbar = () => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

  const links = [
    { label: "דשבורד", href: "/dashboard" },
    { label: "פרויקטים", href: "/projects" },
    { label: "מחירים", href: "/pricing" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={mascot} alt="Pixi" className="h-10 w-10" />
          <span className="text-xl font-bold text-foreground">Pixi</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.href} to={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </button>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            התנתק
          </Button>
        </div>

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

      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          {links.map((link) => (
            <Link key={link.href} to={link.href} onClick={() => setOpen(false)} className="block py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <Button variant="ghost" onClick={signOut} className="mt-2 w-full justify-start gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            התנתק
          </Button>
        </div>
      )}
    </nav>
  );
};

export default DashboardNavbar;
