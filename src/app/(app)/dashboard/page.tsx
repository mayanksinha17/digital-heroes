import { requireUser } from "@/modules/auth/guards";
import { SubscriptionService } from "@/modules/subscriptions/service";
import { ScoreService } from "@/modules/scores/service";
import { CharityService } from "@/modules/charities/service";
import { DrawService } from "@/modules/draws/service";
import { WinnerService } from "@/modules/winners/service";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { ScorePerformanceCard } from "@/components/dashboard/ScorePerformanceCard";
import { CharityImpactCard } from "@/components/dashboard/CharityImpactCard";
import { DrawStatusWidget } from "@/components/dashboard/DrawStatusWidget";
import { UnverifiedWinningsBanner } from "@/components/dashboard/UnverifiedWinningsBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Trophy,
  Heart,
  Plus,
  Settings,
  Gift,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard Overview | Digital Heroes",
  description:
    "Subscriber hub for golf scores, charity allocation, and monthly draw entries.",
};

export default async function DashboardOverviewPage() {
  const viewer = await requireUser();
  const userId = viewer.user.id;

  // 1. Fetch real-time data from authoritative backend services
  const subState = await SubscriptionService.requireSubscriptionState(userId);
  const scores = await ScoreService.getUserScores(userId);
  const currentCharity = viewer.profile.charity_id
    ? await CharityService.getCharityById(viewer.profile.charity_id)
    : null;
  const charityImpact = await SubscriptionService.getUserCharityImpact(userId);
  const latestPublishedDraw = await DrawService.getLatestPublishedDraw();
  const drawParticipation = await DrawService.getUserDrawParticipation(userId);
  const winnings = await WinnerService.getUserWinnings(userId);

  // 2. Identify any unverified winning claims requiring user action
  const unverifiedWins = winnings.filter(
    (w) =>
      w.verification_status === "awaiting_proof" ||
      w.verification_status === "rejected"
  );

  const totalWonCents = winnings.reduce(
    (acc, curr) => acc + Number(curr.prize_cents),
    0
  );
  const totalPaidCents = winnings
    .filter((w) => w.payment_status === "paid")
    .reduce((acc, curr) => acc + Number(curr.prize_cents), 0);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Action Banner for Unverified Wins (if any) */}
      <UnverifiedWinningsBanner unverifiedWins={unverifiedWins} />

      {/* Welcome & Quick Action Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-emerald-400">
                Subscriber Hub
              </span>
              <Badge
                variant={subState.isSubscribed ? "active" : "outline"}
                className="text-[10px] py-0"
              >
                {subState.headline}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {viewer.profile.full_name || "Hero Golfer"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Track your 5-score rolling window, support {currentCharity?.name || "partner charities"}, and participate in monthly cash prize draws.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Link href="/dashboard/scores">
                <Plus className="w-4 h-4" />
                <span>Log Round</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-800 text-slate-300 hover:text-white"
            >
              <Link href="/dashboard/settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Primary 3-Card Pillar KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Subscription Status */}
        <SubscriptionCard
          subscription={subState.subscription}
          headline={subState.headline}
          subLabel={subState.subLabel}
        />

        {/* Module 2: Golf Performance & Rolling Window */}
        <ScorePerformanceCard
          scores={scores}
          isSubscriber={subState.isSubscribed}
        />

        {/* Module 3: Charity Allocation & Cumulative Impact */}
        <CharityImpactCard
          charity={currentCharity}
          charityPercent={viewer.profile.charity_percent || 10}
          charityImpactCents={charityImpact.totalCharityCents}
        />
      </div>

      {/* Module 4: Monthly Draw Participation & Prize Pool Status */}
      <DrawStatusWidget
        isSubscriber={subState.isSubscribed}
        userScores={scores}
        latestPublishedDraw={latestPublishedDraw}
        userDrawParticipation={drawParticipation}
      />

      {/* Module 5: Winnings & Claims Summary Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-copper-500/20 border border-brand-copper-500/40 text-brand-copper-300">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-copper-300">
                Prize Summary
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Your Prize Winnings & Claims
              </h2>
            </div>
          </div>

          <Button asChild variant="outline" size="sm" className="text-xs h-9 gap-1.5">
            <Link href="/dashboard/winnings">
              <span>View All Winnings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Won
            </span>
            <div className="text-2xl font-black text-white">
              {formatMoney(totalWonCents)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Disbursed Payouts
            </span>
            <div className="text-2xl font-black text-emerald-400">
              {formatMoney(totalPaidCents)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Pending Actions
            </span>
            <div className="text-2xl font-black text-amber-400">
              {unverifiedWins.length}{" "}
              {unverifiedWins.length === 1 ? "Prize" : "Prizes"}
            </div>
          </div>
        </div>

        {winnings.length === 0 && (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 space-y-2">
            <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">
              No prize winnings yet. Enter your 5 rounds to qualify for upcoming monthly draws!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
