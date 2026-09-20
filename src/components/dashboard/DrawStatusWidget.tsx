import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Trophy,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { DrawRow } from "@/modules/draws/types";
import type { GolfScore } from "@/modules/scores/service";

interface DrawStatusWidgetProps {
  isSubscriber: boolean;
  userScores: GolfScore[];
  latestPublishedDraw: DrawRow | null;
  userDrawParticipation?: {
    totalDrawsEntered: number;
    entries: Array<{
      id: string;
      drawId: string;
      drawMonth: string;
      scores: number[];
      matchCount: number;
      tier: number | null;
      drawnNumbers?: number[];
    }>;
  };
}

export function DrawStatusWidget({
  isSubscriber,
  userScores,
  latestPublishedDraw,
  userDrawParticipation,
}: DrawStatusWidgetProps) {
  const scoreCount = userScores.length;
  const isQualified = isSubscriber && scoreCount >= 5;

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month

  const rolloverInCents = Number(latestPublishedDraw?.rollover_out_cents || 0);
  const activeNumbers = userScores.slice(0, 5).map((s) => s.score);

  const latestEntry = userDrawParticipation?.entries?.[0];

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-emerald-950/80 border border-brand-emerald-500/40 text-brand-emerald-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-emerald-400">
              Monthly Prize Pool
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Draw Participation & Pool Status
            </h2>
          </div>
        </div>

        <Badge
          variant={isQualified ? "active" : "outline"}
          className={`px-3 py-1 text-xs font-bold gap-1.5 ${
            isQualified
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
              : "border-slate-800 text-slate-400"
          }`}
        >
          {isQualified ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Qualified for Monthly Draw</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{isSubscriber ? `${5 - scoreCount} Scores Needed` : "Subscription Required"}</span>
            </>
          )}
        </Badge>
      </div>

      {/* Grid: Upcoming Draw Status + Active Numbers in Play */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Upcoming Draw Card */}
        <div className="p-5 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-brand-emerald-400" />
                Target Draw Date
              </span>
              <span className="font-bold text-white">
                {nextMonthDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Incoming Jackpot Rollover
              </span>
              <div className="text-2xl font-black text-brand-copper-300">
                {formatMoney(rolloverInCents)}
              </div>
              <p className="text-xs text-slate-400">
                Unclaimed 5-number jackpot pool carries forward to boost this month&apos;s top prize.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Draws Entered:</span>
            <span className="font-bold text-white">
              {userDrawParticipation?.totalDrawsEntered || 0} Draws
            </span>
          </div>
        </div>

        {/* User's Numbers in Play */}
        <div className="p-5 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Your 5 Active Numbers in Play</span>
              <span className="text-xs font-mono text-emerald-400">
                {isQualified ? "5/5 Active" : `${scoreCount}/5 Active`}
              </span>
            </div>

            {isQualified ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {activeNumbers.map((num, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-12 rounded-xl bg-gradient-to-b from-brand-emerald-950/60 to-brand-navy-900 border border-brand-emerald-500/40 flex items-center justify-center text-lg font-mono font-black text-brand-emerald-400 shadow-inner"
                    >
                      {num}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  These 5 Stableford scores represent your official numbers for the upcoming draw.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  {isSubscriber
                    ? `Log ${5 - scoreCount} more Stableford round(s) to activate your 5 lottery numbers.`
                    : "Activate your subscription and log 5 rounds to enter cash prize pools."}
                </p>
                <Button asChild size="sm" variant="outline" className="text-xs h-8">
                  <Link href={isSubscriber ? "/dashboard/scores" : "/pricing"}>
                    {isSubscriber ? "Log Rounds" : "View Plans"}
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Prize Tiers:</span>
            <span className="text-slate-300 font-semibold">
              5 Matches (40%) · 4 Matches (35%) · 3 Matches (25%)
            </span>
          </div>
        </div>
      </div>

      {/* Latest Published Draw Summary Banner (if published draw exists) */}
      {latestPublishedDraw && latestPublishedDraw.drawn_numbers && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/80 to-brand-navy-900/90 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-brand-copper-300" />
              <span className="font-bold text-white">
                Latest Published Draw ({latestPublishedDraw.draw_month})
              </span>
            </div>
            <span className="text-slate-400">
              Total Prize Pool: {formatMoney(Number(latestPublishedDraw.pool_total_cents || 0))}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-2">Winning Numbers:</span>
            {latestPublishedDraw.drawn_numbers.map((num, idx) => (
              <span
                key={idx}
                className="h-8 w-8 rounded-lg bg-brand-emerald-500/20 border border-brand-emerald-500/40 text-brand-emerald-400 font-mono font-bold text-xs flex items-center justify-center"
              >
                {num}
              </span>
            ))}
          </div>

          {latestEntry && (
            <div className="text-xs text-slate-300 pt-1 flex items-center gap-2">
              <span>Your Result:</span>
              <span className="font-semibold text-white">
                {latestEntry.matchCount} {latestEntry.matchCount === 1 ? "match" : "matches"}
                {latestEntry.tier ? ` (Tier ${latestEntry.tier} Winner!)` : " (No tier won)"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
