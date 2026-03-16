import { Link } from "react-router-dom";
import { Linkedin, Twitter } from "lucide-react";
import { useDirection } from "@/contexts/DirectionContext";

const Footer = () => {
  const { t } = useDirection();

  return (
    <footer className="border-t border-border bg-card py-10">
      <div className="container mx-auto flex flex-col items-center gap-6 px-4 md:flex-row md:justify-between">
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/pricing" className="hover:text-foreground transition-colors">{t("footer.pricing")}</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">{t("footer.terms")}</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">{t("footer.privacy")}</Link>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Linkedin className="h-5 w-5" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Twitter className="h-5 w-5" />
          </a>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 Pixi</p>
      </div>
    </footer>
  );
};

export default Footer;
