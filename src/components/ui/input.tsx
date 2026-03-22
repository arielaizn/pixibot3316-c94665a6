import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "luxury";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    const variants = {
      default: `
        flex h-10 w-full rounded-md border border-input
        bg-background px-3 py-2 text-base
        ring-offset-background
        file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
        placeholder:text-muted-foreground
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        md:text-sm
      `,

      luxury: `
        flex h-12 w-full rounded-luxury border-2 border-border/50
        bg-card/50 backdrop-blur-sm px-4 py-3 text-base
        font-medium text-foreground
        shadow-luxury-sm
        ring-offset-background
        file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground
        placeholder:text-muted-foreground/60 placeholder:font-normal
        focus:outline-none focus:border-primary/50 focus:bg-card
        focus:shadow-luxury-md focus:shadow-primary/10
        focus:ring-4 focus:ring-primary/10
        hover:border-border hover:bg-card/70
        disabled:cursor-not-allowed disabled:opacity-50
        transition-all duration-200 ease-out
      `,
    };

    return (
      <input
        type={type}
        className={cn(variants[variant], className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
