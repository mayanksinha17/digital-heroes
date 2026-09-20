import { requireUser } from "@/modules/auth/guards";
import { SubscriptionService } from "@/modules/subscriptions/service";
import { createCheckoutAction } from "@/modules/subscriptions/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ShieldCheck } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose Subscription Plan | Digital Heroes",
  description: "Select your Digital Heroes monthly or discounted yearly subscription plan.",
};

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const viewer = await requireUser();
  const plans = await SubscriptionService.getActivePlans();
  const monthlyPlan = plans.find((p) => p.code === "monthly");
  const yearlyPlan = plans.find((p) => p.code === "yearly");

  const preferredPlan = searchParams.plan === "yearly" ? "yearly" : "monthly";

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-white">Activate Your Subscription</h1>
        <p className="text-sm text-slate-300">
          Hi {viewer.profile.full_name}, choose a plan to start logging your golf rounds and entering the monthly prize draws.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Card */}
        {monthlyPlan && (
          <Card className="glass-card flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Monthly Plan</CardTitle>
                <Badge variant="secondary">Flexible</Badge>
              </div>
              <CardDescription>Billed month-to-month. Cancel anytime.</CardDescription>
              <div className="text-3xl font-extrabold text-white pt-2">
                {formatMoney(monthlyPlan.price_cents, monthlyPlan.currency)}
                <span className="text-xs font-normal text-slate-400"> / month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-brand-emerald-400" />
                  <span>5-Score rolling window tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-brand-emerald-400" />
                  <span>{viewer.profile.charity_percent}% to your designated charity</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-brand-emerald-400" />
                  <span>Monthly 5/4/3-match prize draws</span>
                </li>
              </ul>

              <form action={createCheckoutAction.bind(null, "monthly")}>
                <Button variant="outline" className="w-full">
                  Checkout Monthly
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Yearly Card (Discounted) */}
        {yearlyPlan && (
          <Card className="glass-card border-2 border-brand-copper-500/50 relative overflow-hidden flex flex-col justify-between shadow-xl shadow-brand-copper-950/40">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-brand-copper-500 to-brand-copper-600 text-brand-navy-900 font-bold text-[10px] px-3 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Save ~17% (2 Months Free)</span>
            </div>

            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Yearly Plan</CardTitle>
                <Badge variant="gold">Discounted</Badge>
              </div>
              <CardDescription>Continuous 12-month draw participation.</CardDescription>
              <div className="text-3xl font-extrabold gold-gradient-text pt-2">
                {formatMoney(yearlyPlan.price_cents, yearlyPlan.currency)}
                <span className="text-xs font-normal text-slate-400"> / year</span>
              </div>
              <p className="text-[11px] text-brand-copper-300">
                Equivalent to {formatMoney(yearlyPlan.monthly_equivalent_cents, yearlyPlan.currency)}/month
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-brand-emerald-400" />
                  <span>Continuous 12-month draw eligibility</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-brand-emerald-400" />
                  <span>{viewer.profile.charity_percent}% to your designated charity</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-brand-emerald-400" />
                  <span>Uncapped 5-number jackpot rollover access</span>
                </li>
              </ul>

              <form action={createCheckoutAction.bind(null, "yearly")}>
                <Button variant="gold" className="w-full">
                  Checkout Yearly (Best Value)
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4 text-brand-emerald-400" />
        <span>Payments processed by Stripe. No credit card information stored on our servers.</span>
      </div>
    </div>
  );
}
