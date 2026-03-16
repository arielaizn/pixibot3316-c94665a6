import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

const NotAdminPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
      <ShieldX className="h-10 w-10 text-destructive" />
    </div>
    <h1 className="mb-2 text-3xl font-extrabold text-foreground">אינך מנהל</h1>
    <p className="mb-8 text-muted-foreground">אין לך גישה לממשק הניהול של Pixi</p>
    <Button asChild className="rounded-xl bg-primary px-8 py-5 text-base font-bold text-primary-foreground hover:bg-primary/90">
      <Link to="/">חזרה לדף הבית</Link>
    </Button>
  </div>
);

export default NotAdminPage;
