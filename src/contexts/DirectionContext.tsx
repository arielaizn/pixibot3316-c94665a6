import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { createTranslator, type Lang, type TranslationKey } from "@/lib/i18n";

interface DirectionContextType {
  direction: "rtl" | "ltr";
  lang: Lang;
  toggleDirection: () => void;
  isRTL: boolean;
  t: (key: TranslationKey) => string;
}

const DirectionContext = createContext<DirectionContextType | undefined>(undefined);

export const DirectionProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("pixi_language");
    return saved === "en" ? "en" : "he";
  });

  const direction = lang === "he" ? "rtl" : "ltr";
  const isRTL = lang === "he";

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = lang;
    localStorage.setItem("pixi_language", lang);
    // Keep legacy key in sync
    localStorage.setItem("pixi_direction", direction);
  }, [lang, direction]);

  const toggleDirection = useCallback(() => {
    setLang((prev) => (prev === "he" ? "en" : "he"));
  }, []);

  const t = useCallback(createTranslator(lang), [lang]);

  return (
    <DirectionContext.Provider value={{ direction, lang, toggleDirection, isRTL, t }}>
      {children}
    </DirectionContext.Provider>
  );
};

export const useDirection = () => {
  const context = useContext(DirectionContext);
  if (!context) throw new Error("useDirection must be used within DirectionProvider");
  return context;
};
