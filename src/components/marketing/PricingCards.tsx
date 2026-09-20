import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Heart, Trophy } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { Plan } from "@/modules/subscriptions/service";

export function PricingCards({
  plans,
  isAuthenticated = false,
}: {
  plans: Plan[];
  isAuthenticated?: boolean;
}) {
  const monthlyPlan = plans.find((p) => p.code === "monthly") || {
    id: "monthly",
    code: "monthly",
    name: "Monthly Hero Plan",
    price_cents: 49900,
    currency: "INR",
    billing_interval: "month" as const,
    monthly_equivalent_cents: 49900,
    is_active: true,
    stripe_price_id: null,
  };

  const yearlyPlan = plans.find((p) => p.code === "yearly") || {
    id: "yearly",
    code: "yearly",
    name: "Yearly Hero Plan (Discounted)",
    price_cents: 499900,
    currency: "INR",
    billing_interval: "year" as const,
    monthly_equivalent_cents: 41658,
    is_active: true,
    stripe_price_id: null,
  };

  const targetHref = (code: string) =>
    isAuthenticated ? `/subscribe?plan=${code}` : `/signup?plan=${code}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {/* Monthly Plan */}
      <div className="glass-card rounded-3xl p-8 flex flex-col justify-between border border-white/10 hover:border-brand-emerald-500/30 transition-all space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Monthly Hero</h3>
            <Badge variant="secondary">Flexible</Badge>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">
                {formatMoney(monthlyPlan.price_cents, monthlyPlan.currency)}
              </span>
              <span className="text-sm text-slate-400">/ month</span>
            </div>
            <p className="text-xs text-slate-400">Billed monthly. Cancel anytime.</p>
          </div>

          <ul className="space-y-3 pt-4 border-t border-white/5 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-emerald-400 shrink-0" />
              <span>5-Score Stableford performance tracking</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-emerald-400 shrink-0" />
              <span>Guaranteed 10%+ allocated to your selected charity</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-emerald-400 shrink-0" />
              <span>Full entry into monthly 5/4/3-match prize draws</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-emerald-400 shrink-0" />
              <span>Eligible for uncapped 5-number jackpot rollover</span>
            </li>
          </ul>
        </div>

        <Link href={targetHref("monthly")} className="w-full">
          <Button variant="outline" className="w-full h-12">
            Subscribe Monthly
          </Button>
        </Link>
      </div>

      {/* Yearly Plan (Discounted - PRD §04) */}
      <div className="glass-card rounded-3xl p-8 flex flex-col justify-between border-2 border-brand-copper-500/50 relative overflow-hidden space-y-6 shadow-2xl shadow-brand-copper-900/20">
        <div className="absolute top-0 right-0 bg-gradient-to-l from-brand-copper-500 to-brand-copper-600 text-brand-navy-900 font-bold text-[11px] px-4 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-md">
          <Sparkles className="h-3 w-3" />
          <span>Save ~17% (2 Months Free)</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Yearly Hero</h3>
            <Badge variant="gold">Best Value</Badge>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold gold-gradient-text">
                {formatMoney(yearlyPlan.price_cents, yearlyPlan.currency)}
              </span>
              <span className="text-sm text-slate-400">/ year</span>
            </div>
            <p className="text-xs text-brand-copper-300 font-medium">
              Equivalent to just {formatMoney(yearlyPlan.monthly_equivalent_cents, yearlyPlan.currency)}/month
            </p>
          </div>

          <ul className="space-y-3 pt-4 border-t border-white/5 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-emerald-400 shrink-0" />
              <span>Continuous 12-month draw eligibility</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-emerald-400 shrink-0" />
              <span>Substantial discount over monthly subscription</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-emerald-400 shrink-0" />
              <span>Guaranteed 10%+ upfront charitable funding</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-emerald-400 shrink-0" />
              <span>Priority winner verification queue review</span>
            </li>
          </ul>
        </div>

        <Link href={targetHref("yearly")} className="w-full">
          <Button variant="gold" className="w-full h-12 text-base">
            Subscribe Yearly (Discounted)
          </Button>
        </Link>
      </div>
    </div>
  );
}
