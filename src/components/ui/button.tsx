import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-brand-emerald-600 to-brand-emerald-500 text-white shadow-lg shadow-brand-emerald-900/30 hover:from-brand-emerald-500 hover:to-brand-emerald-400",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-white/10 bg-brand-navy-800/80 text-white backdrop-blur hover:bg-brand-navy-700 hover:text-white",
        secondary:
          "bg-brand-navy-700 text-white hover:bg-brand-navy-600",
        ghost:
          "text-slate-300 hover:bg-white/5 hover:text-white",
        link: "text-brand-emerald-400 underline-offset-4 hover:underline",
        gold:
          "bg-gradient-to-r from-brand-copper-600 to-brand-copper-400 text-brand-navy-900 font-bold shadow-lg shadow-brand-copper-700/20 hover:from-brand-copper-500 hover:to-brand-copper-300",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-13 rounded-2xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
