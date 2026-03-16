import { useState } from "react";
import mascot from "@/assets/pixi-mascot.png";

const FloatingMascot = () => {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href="https://wa.me/972525515776"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      <div className={`absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background shadow-lg transition-all duration-200 ${hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        צריך סרטון AI?
      </div>
      <img
        src={mascot}
        alt="Pixi Mascot"
        className="h-16 w-16 animate-float animate-glow cursor-pointer transition-transform duration-200 hover:scale-110"
      />
    </a>
  );
};

export default FloatingMascot;
