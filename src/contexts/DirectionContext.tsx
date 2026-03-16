import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Direction = "rtl" | "ltr";

interface DirectionContextType {
  direction: Direction;
  toggleDirection: () => void;
  isRTL: boolean;
}

const DirectionContext = createContext<DirectionContextType | undefined>(undefined);

export const DirectionProvider = ({ children }: { children: ReactNode }) => {
  const [direction, setDirection] = useState<Direction>(() => {
    const saved = localStorage.getItem("pixi_direction");
    return (saved === "ltr" ? "ltr" : "rtl") as Direction;
  });

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = direction === "rtl" ? "he" : "en";
    localStorage.setItem("pixi_direction", direction);
  }, [direction]);

  const toggleDirection = () => {
    setDirection((prev) => (prev === "rtl" ? "ltr" : "rtl"));
  };

  return (
    <DirectionContext.Provider value={{ direction, toggleDirection, isRTL: direction === "rtl" }}>
      {children}
    </DirectionContext.Provider>
  );
};

export const useDirection = () => {
  const context = useContext(DirectionContext);
  if (!context) throw new Error("useDirection must be used within DirectionProvider");
  return context;
};
