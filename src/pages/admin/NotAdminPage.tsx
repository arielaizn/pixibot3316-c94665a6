import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";
import { useDirection } from "@/contexts/DirectionContext";

const NotAdminPage = () => {
  const { t } = useDirection();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <ShieldX className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="mb-2 text-3xl font-extrabold text-foreground">{t("notAdmin.title")}</h1>
      <p className="mb-8 text-muted-foreground">{t("notAdmin.desc")}</p>
      <Button asChild className="rounded-xl bg-primary px-8 py-5 text-base font-bold text-primary-foreground hover:bg-primary/90">
        <Link to="/">{t("notAdmin.back")}</Link>
      </Button>
    </div>
  );
};

export default NotAdminPage;
