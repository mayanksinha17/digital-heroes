import { SubscriptionService } from "@/modules/subscriptions/service";
import { getViewer } from "@/modules/auth/guards";
import { PricingCards } from "@/components/marketing/PricingCards";
import { ShieldCheck, Heart, Trophy, Sparkles } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subscription Plans & Pricing | Digital Heroes",
  description:
    "Choose between flexible monthly or discounted yearly plans. Track your golf scores, donate to verified charities, and participate in monthly draws.",
};

export default async function PricingPage() {
  const plans = await SubscriptionService.getActivePlans();
  const viewer = await getViewer();

  return (
    <div className="min-h-screen bg-brand-navy-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-emerald-500/30 bg-brand-emerald-900/30 px-4 py-1 text-xs font-semibold text-brand-emerald-400">
            <Trophy className="h-3.5 w-3.5" />
            <span>Monthly Draw Rewards · Guaranteed Impact</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="text-slate-300 text-base">
            Every subscription includes your Stableford score history, continuous monthly prize draw eligibility, and at least 10% designated to charity.
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards plans={plans} isAuthenticated={Boolean(viewer)} />

        {/* Guarantees & Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/10 text-center">
          <div className="space-y-2">
            <Heart className="h-6 w-6 text-brand-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Charity First</h4>
            <p className="text-xs text-slate-400">
              A minimum of 10% of every subscription goes directly to your selected charity partner.
            </p>
          </div>
          <div className="space-y-2">
            <Trophy className="h-6 w-6 text-brand-copper-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">40/35/25 Prize Pool</h4>
            <p className="text-xs text-slate-400">
              50% of subscriptions pool into monthly 5, 4, and 3-number match reward tiers.
            </p>
          </div>
          <div className="space-y-2">
            <ShieldCheck className="h-6 w-6 text-blue-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Cancel Anytime</h4>
            <p className="text-xs text-slate-400">
              No locked contracts. Manage your billing or cancel anytime with one click in the Customer Portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
