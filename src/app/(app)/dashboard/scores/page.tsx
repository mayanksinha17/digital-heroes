import { requireUser } from "@/modules/auth/guards";
import { ScoreService } from "@/modules/scores/service";
import { SubscriptionService } from "@/modules/subscriptions/service";
import { ScoreEditor } from "@/components/dashboard/ScoreEditor";
import { Trophy, ShieldCheck, RefreshCw, Calendar, Sparkles } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Golf Score Management | Digital Heroes",
  description: "Manage your 5-score rolling window and track Stableford performance for monthly prize draws.",
};

export default async function DashboardScoresPage() {
  const viewer = await requireUser();
  const scores = await ScoreService.getUserScores(viewer.user.id);
  const isSubscriber = await SubscriptionService.isUserActiveSubscriber(viewer.user.id);

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-emerald-950/80 border border-brand-emerald-500/40 text-brand-emerald-400">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Golf Score Management</h1>
              <p className="text-xs text-slate-400">
                PRD §05 · 1–45 Stableford scale · 5-score deterministic rolling window
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                isSubscriber
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-950/40 border-amber-500/30 text-amber-400"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isSubscriber ? "Subscriber Access Active" : "Non-Subscriber (Read-Only)"}
            </span>
          </div>
        </div>
      </div>

      {/* Score Editor Component */}
      <ScoreEditor initialScores={scores} isSubscriber={isSubscriber} />

      {/* Explanatory Technical Guidelines & Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/80">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <RefreshCw className="w-4 h-4" />
            <h4 className="text-sm font-semibold text-white">Five-Score Rolling Window</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Only your latest 5 rounds are retained. A new round automatically replaces your oldest
            stored score by played date.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <Calendar className="w-4 h-4" />
            <h4 className="text-sm font-semibold text-white">One Score Per Date</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Strict uniqueness is enforced. You can have only one score per calendar date. Existing
            scores on a date can be modified anytime.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <h4 className="text-sm font-semibold text-white">Monthly Draw Entries</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Having 5 active scores automatically enters you into the monthly prize draw pools (Tier 1: 5 matches, Tier 2: 4 matches, Tier 3: 3 matches).
          </p>
        </div>
      </div>
    </div>
  );
}
