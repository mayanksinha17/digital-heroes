import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  CreditCard,
  Heart,
  Trophy,
  Layers,
  Award,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Coins,
  RefreshCw,
} from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How It Works | Digital Heroes",
  description:
    "Learn how the Digital Heroes golf reward platform works: subscriptions, 5-score rolling window, charity allocations, and monthly prize pools.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      step: 1,
      icon: CreditCard,
      title: "Subscribe to a Membership Plan",
      description:
        "Choose either the flexible Monthly Plan (₹499/mo) or the discounted Annual Plan (₹4,999/yr, saving ~17%). An active subscription gives you full access to score logging, partner charity allocations, and monthly draw entries.",
      color: "emerald",
    },
    {
      step: 2,
      icon: Heart,
      title: "Designate Your Partner Charity",
      description:
        "Select a verified cause from our partner charity directory. A minimum of 10% of every subscription invoice is automatically dedicated to your selected charity. You can voluntarily increase your giving percentage up to 100%.",
      color: "rose",
    },
    {
      step: 3,
      icon: Layers,
      title: "Log Your Stableford Rounds",
      description:
        "Enter your 18-hole Stableford scores on the official 1–45 scale. You can log one score per calendar date. As you play more rounds, your deterministic 5-score rolling window automatically updates.",
      color: "cyan",
    },
    {
      step: 4,
      icon: RefreshCw,
      title: "Your Latest 5 Scores Form Your Entry",
      description:
        "Once you record 5 valid rounds, those 5 Stableford numbers become your official lottery entry for the monthly draw. If you log a 6th round, it automatically evicts your oldest score by played date.",
      color: "amber",
    },
    {
      step: 5,
      icon: Trophy,
      title: "Monthly Prize Draw Matching",
      description:
        "At the end of each month, 50% of all active subscription revenue is allocated to the prize pool. 5 winning numbers are drawn (using cryptographic CSPRNG or algorithmic frequency weighting). You win cash if you match 3, 4, or 5 numbers!",
      color: "yellow",
    },
    {
      step: 6,
      icon: Award,
      title: "Verify Proof & Receive Cash Payout",
      description:
        "Winning subscribers upload a scorecard screenshot from their club or scoring app to verify their rounds. Once approved by our review team, prize disbursements are marked and paid.",
      color: "emerald",
    },
  ];

  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-emerald-500/30 bg-brand-emerald-950/40 px-4 py-1.5 text-xs font-semibold text-brand-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Digital Heroes Protocol</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          How Digital Heroes Works
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          A step-by-step breakdown of how your golf game generates guaranteed charitable impact and qualifies you for monthly cash prize rewards.
        </p>
      </div>

      {/* 6-Step Visual Timeline */}
      <div className="space-y-6">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 border border-white/10 hover:border-white/20 transition"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-navy-900 border border-white/10 text-brand-emerald-400 font-black text-lg shadow-inner">
                #{s.step}
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-brand-emerald-400" />
                  <h3 className="text-lg font-bold text-white">{s.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prize Pool Distribution & Rollover Mechanics Explainer */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-brand-navy-900 to-brand-navy-950">
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Prize Pool Mathematics · PRD §07
          </span>
          <h2 className="text-2xl font-bold text-white">How Prize Pools & Tiers Are Calculated</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            50% of the active monthly subscriber revenue forms the baseline prize pool. The total pool is split deterministically across 3 tiers:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Tier 1 · 5 Matches (40%)
            </span>
            <div className="text-lg font-bold text-white">Jackpot Pool</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Awarded equally to subscribers whose 5 numbers match all 5 drawn numbers. If unclaimed, 100% of this 40% pool carries forward into the next month&apos;s jackpot rollover.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tier 2 · 4 Matches (35%)
            </span>
            <div className="text-lg font-bold text-white">4-Number Tier</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Awarded equally to subscribers matching exactly 4 numbers. If unclaimed, this tier remains unallocated in the platform reserve.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tier 3 · 3 Matches (25%)
            </span>
            <div className="text-lg font-bold text-white">3-Number Tier</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Awarded equally to subscribers matching exactly 3 numbers. If unclaimed, this tier remains unallocated in the platform reserve.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="text-center space-y-4 pt-6">
        <h3 className="text-xl font-bold text-white">Ready to start logging rounds and giving back?</h3>
        <Button
          asChild
          size="lg"
          className="bg-brand-emerald-500 hover:bg-brand-emerald-600 text-slate-950 font-bold px-8 h-12 gap-2"
        >
          <Link href="/signup">
            <span>Join Digital Heroes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
