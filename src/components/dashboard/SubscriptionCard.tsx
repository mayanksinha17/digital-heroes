import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createBillingPortalAction } from "@/modules/subscriptions/actions";
import { formatDate } from "@/lib/dates";
import { CreditCard, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import type { Subscription } from "@/modules/subscriptions/service";

interface SubscriptionCardProps {
  subscription: Subscription | null;
  headline: "Active" | "Inactive";
  subLabel: string;
}

export function SubscriptionCard({
  subscription,
  headline,
  subLabel,
}: SubscriptionCardProps) {
  const isActive = headline === "Active";

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <CreditCard className="h-4 w-4 text-brand-emerald-400" />
            <span>Subscription Status</span>
          </div>
          <Badge variant={isActive ? "active" : "inactive"} className="px-2.5 py-0.5 text-xs">
            {isActive ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Inactive
              </span>
            )}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-bold text-white tracking-tight">{headline}</div>
          <p className="text-xs text-slate-300">{subLabel}</p>
        </div>

        {subscription?.current_period_end && (
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Renewal Date:</span>
            <span className="font-semibold text-white">
              {formatDate(subscription.current_period_end)}
            </span>
          </div>
        )}
      </div>

      <div className="pt-2">
        {isActive ? (
          <form action={createBillingPortalAction}>
            <Button variant="outline" size="sm" className="w-full text-xs h-9">
              Manage Billing & Plan
            </Button>
          </form>
        ) : (
          <Link href="/pricing" className="w-full">
            <Button size="sm" className="w-full text-xs h-9 gap-1.5">
              <span>Activate Plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
