import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { MotionFadeIn } from "@/components/motion/MotionFadeIn";
import { PricingCards } from "@/components/marketing/PricingCards";
import { SubscriptionService } from "@/modules/subscriptions/service";
import { CharityService } from "@/modules/charities/service";
import { DrawService } from "@/modules/draws/service";
import { AuthService } from "@/modules/auth/service";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Heart,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Users,
  Coins,
} from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Digital Heroes | Subscription Golf, Charity Impact & Monthly Draws",
  description:
    "Track your 5 Stableford golf scores, support verified charities with every subscription, and qualify for guaranteed monthly prize pool draws.",
};

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userSummary = null;
  if (user) {
    const profile = await AuthService.getProfileById(user.id);
    userSummary = {
      id: user.id,
      email: user.email || "",
      role: profile?.role || "subscriber",
    };
  }

  const plans = await SubscriptionService.getActivePlans();
  const featuredCharities = await CharityService.getCharities({ featuredOnly: true });
  const latestDraw = await DrawService.getLatestPublishedDraw();

  return (
    <div className="min-h-screen bg-brand-navy-950 text-foreground flex flex-col justify-between selection:bg-brand-emerald-500/20 selection:text-brand-emerald-400">
      <PublicNav user={userSummary} />

      <main className="flex-1 space-y-20 sm:space-y-28 pb-20">
        {/* 1. Hero Section */}
        <section className="relative pt-12 sm:pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
          <MotionFadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-emerald-500/30 bg-brand-emerald-950/40 px-4 py-1.5 text-xs font-semibold text-brand-emerald-400 mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Feel, Not Fairway · Performance & Giving</span>
            </div>
          </MotionFadeIn>

          <MotionFadeIn delay={0.2}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
              Every Round Counts. <br className="hidden sm:inline" />
              <span className="emerald-gradient-text">Give Back.</span>{" "}
              <span className="gold-gradient-text">Win Big.</span>
            </h1>
          </MotionFadeIn>

          <MotionFadeIn delay={0.3}>
            <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Track your 5-score Stableford window, allocate at least 10% of your subscription fee to partner charities, and enter monthly cash prize pools.
            </p>
          </MotionFadeIn>

          <MotionFadeIn delay={0.4}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-brand-emerald-500 hover:bg-brand-emerald-600 text-slate-950 font-bold px-8 h-12 gap-2 text-sm shadow-xl shadow-brand-emerald-950/40"
              >
                <Link href={user ? "/dashboard" : "/signup"}>
                  <span>{user ? "Open Subscriber Hub" : "Subscribe & Play"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 px-8 h-12 text-sm backdrop-blur"
              >
                <Link href="/how-it-works">See How It Works</Link>
              </Button>
            </div>
          </MotionFadeIn>

          {/* Real Trust & Guarantee Strip */}
          <MotionFadeIn delay={0.5}>
            <div className="mt-14 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
              <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-emerald-400 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  Giving Floor
                </span>
                <div className="text-xl font-black text-white mt-1">Min 10%</div>
                <p className="text-[11px] text-slate-400">Guaranteed to charity</p>
              </div>

              <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  Monthly Pool
                </span>
                <div className="text-xl font-black text-white mt-1">50% Share</div>
                <p className="text-[11px] text-slate-400">Of all subscription fees</p>
              </div>

              <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Stableford
                </span>
                <div className="text-xl font-black text-white mt-1">5-Score Window</div>
                <p className="text-[11px] text-slate-400">Auto-rolling latest rounds</p>
              </div>

              <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-copper-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  Jackpot Rollover
                </span>
                <div className="text-xl font-black text-white mt-1">Uncapped</div>
                <p className="text-[11px] text-slate-400">5-match pool carries forward</p>
              </div>
            </div>
          </MotionFadeIn>
        </section>

        {/* 2. 3-Pillar Value Proposition */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Three Pillars of Digital Heroes
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              A transparent ecosystem connecting your weekend performance to charitable impact and cash rewards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card rounded-3xl p-8 space-y-4 relative overflow-hidden border border-brand-emerald-500/20 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-emerald-950/80 border border-brand-emerald-500/40 text-brand-emerald-400">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">1. Rolling 5 Scores</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Log Stableford scores on the 1–45 scale. The deterministic 5-score rolling window automatically retains your 5 most recent rounds. These 5 scores become your official draw lottery numbers.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-400 pt-3 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald-400" />
                  <span>1 score per calendar date constraint</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald-400" />
                  <span>Automatic eviction of oldest round</span>
                </li>
              </ul>
            </div>

            <div className="glass-card rounded-3xl p-8 space-y-4 relative overflow-hidden border border-rose-500/20 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">2. Guaranteed Giving</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Every subscription allocates at least 10% directly to your chosen verified partner charity. You can voluntarily increase your percentage up to 100% or make independent direct donations.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-400 pt-3 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>10% hard floor enforced in database</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Searchable verified charity directory</span>
                </li>
              </ul>
            </div>

            <div className="glass-card rounded-3xl p-8 space-y-4 relative overflow-hidden border border-amber-500/20 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400">
                  <Trophy className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">3. Monthly Prize Draws</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  50% of all subscription revenue funds the monthly prize pool. Match 3, 4, or 5 numbers for guaranteed cash prizes split equally within tiers (40% / 35% / 25%).
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-400 pt-3 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unclaimed 5-match jackpot rolls over</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scorecard screenshot proof verification</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Latest Draw Highlight (if published draw exists) */}
        {latestDraw && latestDraw.drawn_numbers && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-brand-navy-900 to-brand-navy-950 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Latest Official Results
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    {latestDraw.draw_month} Monthly Draw Results
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400">Total Prize Pool:</span>
                  <div className="text-2xl font-black text-amber-300">
                    {formatMoney(Number(latestDraw.pool_total_cents || 0))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                {latestDraw.drawn_numbers.map((num, idx) => (
                  <div
                    key={idx}
                    className="h-12 w-12 rounded-xl bg-brand-emerald-500/20 border border-brand-emerald-500/40 flex items-center justify-center text-lg font-mono font-black text-brand-emerald-400 shadow-sm"
                  >
                    {num}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Draw Mode: <strong className="text-white capitalize">{latestDraw.mode}</strong></span>
                <Link href="/draws" className="text-amber-400 hover:underline font-semibold">
                  View Full Draw Breakdown →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 4. Featured Partner Charities Spotlight */}
        {featuredCharities.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  Featured Beneficiaries
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Partner Charities You Can Support
                </h2>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs h-9">
                <Link href="/charities">
                  <span>Explore All Charities</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCharities.slice(0, 3).map((charity) => (
                <div
                  key={charity.id}
                  className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-[10px] text-rose-300 border-rose-500/30">
                      {charity.category || "General"}
                    </Badge>
                    <h3 className="text-lg font-bold text-white">{charity.name}</h3>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {charity.short_description}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                    <Link href={`/charities/${charity.slug}`}>View Charity Profile</Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Transparent Membership
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Choose Your Subscription Plan
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Both plans include 5-score Stableford window management, guaranteed charity allocation, and monthly cash draw qualification.
            </p>
          </div>

          <PricingCards plans={plans} isAuthenticated={Boolean(user)} />
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
