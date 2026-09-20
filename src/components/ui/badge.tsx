import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-emerald-500/20 text-brand-emerald-400 border-brand-emerald-500/30",
        secondary:
          "border-transparent bg-brand-navy-700 text-slate-200",
        destructive:
          "border-transparent bg-red-500/20 text-red-400 border-red-500/30",
        outline: "text-foreground border-white/20",
        gold: "border-brand-copper-500/30 bg-brand-copper-500/20 text-brand-copper-300",
        active: "border-emerald-500/30 bg-emerald-500/20 text-emerald-300",
        inactive: "border-slate-600 bg-slate-800/60 text-slate-400",
        pending: "border-amber-500/30 bg-amber-500/20 text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
