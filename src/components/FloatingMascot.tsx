import { useState } from "react";
import { useNavigate } from "react-router-dom";
import mascot from "@/assets/pixi-mascot.png";

const FloatingMascot = () => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/signup")}
      className="fixed bottom-6 left-6 z-50 group cursor-pointer border-none bg-transparent p-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background shadow-lg transition-all duration-200 ${hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        התחל בחינם
      </div>
      <img
        src={mascot}
        alt="Pixi Mascot"
        className="h-16 w-16 animate-float animate-glow transition-transform duration-200 hover:scale-110"
      />
    </button>
  );
};

export default FloatingMascot;
