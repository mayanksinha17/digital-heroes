import { requireUser } from "@/modules/auth/guards";
import { WinnerService } from "@/modules/winners/service";
import { WinnerCard } from "@/components/dashboard/WinnerCard";
import { formatMoney } from "@/lib/money";
import { Trophy, ShieldCheck, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Winnings & Claims | Digital Heroes",
  description: "View and verify your monthly draw prizes, upload round score proof, and track payouts.",
};

export default async function DashboardWinningsPage() {
  const viewer = await requireUser();
  const winnings = await WinnerService.getUserWinnings(viewer.user.id);

  const totalWonCents = winnings.reduce((acc, curr) => acc + Number(curr.prize_cents), 0);
  const totalPaidCents = winnings
    .filter((w) => w.payment_status === "paid")
    .reduce((acc, curr) => acc + Number(curr.prize_cents), 0);
  const pendingClaims = winnings.filter((w) => w.payment_status !== "paid");

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-copper-500/20 border border-brand-copper-500/40 text-brand-copper-300">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Your Prize Winnings</h1>
              <p className="text-xs text-slate-400">
                PRD §09 · Verified Stableford score proof and prize disbursement
              </p>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Prizes Won
            </span>
            <div className="text-2xl font-bold text-white">{formatMoney(totalWonCents)}</div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Disbursed Payouts
            </span>
            <div className="text-2xl font-bold text-emerald-400">{formatMoney(totalPaidCents)}</div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Pending Claims
            </span>
            <div className="text-2xl font-bold text-amber-400">
              {pendingClaims.length} {pendingClaims.length === 1 ? "Prize" : "Prizes"}
            </div>
          </div>
        </div>
      </div>

      {/* Winnings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Prize Records</h2>
            <p className="text-xs text-slate-400">
              Every prize won across monthly random and algorithmic draws.
            </p>
          </div>
        </div>

        {winnings.length > 0 ? (
          <div className="space-y-4">
            {winnings.map((winner) => (
              <WinnerCard key={winner.id} winner={winner} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 space-y-3">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-300">No Prize Winnings Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Keep entering your 5 recent golf rounds to qualify for the next monthly draw. 3, 4,
              and 5-number matches win cash prize pools!
            </p>
          </div>
        )}
      </div>

      {/* Verification Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="text-sm font-semibold text-white">Score Verification</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload a clear screenshot of your round scores from your club or scoring platform
            matching your winning entry.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <Clock className="w-4 h-4" />
            <h4 className="text-sm font-semibold text-white">3 Review Attempts</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            If a submission is rejected for illegibility, you can re-upload up to 3 times before
            requiring manual support review.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-brand-copper-300">
            <CheckCircle2 className="w-4 h-4" />
            <h4 className="text-sm font-semibold text-white">Guaranteed Payout</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Once approved by our verification team, payouts are processed directly and tracked in
            your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
