import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import mascot from "@/assets/pixi-mascot.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const links = [
    { label: "בית", href: "/" },
    { label: "מחירים", href: "/pricing" },
    { label: "התחברות", href: "/login" },
    { label: "הרשמה", href: "/signup" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - right side in RTL */}
        <Link to="/" className="flex items-center gap-2">
          <img src={mascot} alt="Pixi" className="h-10 w-10" />
          <span className="text-xl font-bold text-foreground">Pixi</span>
        </Link>

        {/* Desktop menu - left side in RTL */}
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
          <Button asChild className="rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
            <Link to="/signup">התחל עכשיו</Link>
          </Button>
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
          {links.map((link) => (
            <Link key={link.href} to={link.href} onClick={() => setOpen(false)} className="block py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <Button asChild className="mt-2 w-full rounded-full bg-primary font-semibold text-primary-foreground">
            <Link to="/signup" onClick={() => setOpen(false)}>התחל עכשיו</Link>
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
