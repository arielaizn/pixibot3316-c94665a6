import * as React from "react";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "luxury" | "glass" | "glow";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "rounded-lg border bg-card text-card-foreground shadow-sm",

      luxury: `
        rounded-luxury border border-border/50
        bg-gradient-to-br from-card via-card to-card/80
        text-card-foreground
        shadow-luxury-md
        relative
        before:absolute before:inset-0 before:rounded-luxury
        before:border before:border-primary/10
        before:opacity-0 hover:before:opacity-100
        before:transition-opacity before:duration-300
        hover:shadow-luxury-lg
        hover:-translate-y-1
        transition-all duration-300 ease-out
      `,

      glass: `
        rounded-luxury-lg border border-border/30
        bg-card/40 backdrop-blur-xl
        text-card-foreground
        shadow-luxury-lg
        hover:bg-card/60 hover:border-primary/20
        hover:shadow-luxury-xl
        hover:-translate-y-0.5
        transition-all duration-300 ease-out
      `,

      glow: `
        rounded-luxury border-2 border-primary/30
        bg-gradient-to-br from-card via-primary/5 to-card
        text-card-foreground
        shadow-luxury-md shadow-primary/20
        relative
        before:absolute before:inset-0 before:rounded-luxury
        before:bg-gradient-to-br before:from-primary/10 before:to-transparent
        before:opacity-0 hover:before:opacity-100
        before:transition-opacity before:duration-500
        hover:shadow-luxury-lg hover:shadow-primary/30
        hover:border-primary/50
        hover:-translate-y-1 hover:scale-[1.01]
        transition-all duration-300 ease-out
        animate-glow-pulse
      `,
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
