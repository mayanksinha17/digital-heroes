import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Plus, RefreshCw, CheckCircle2 } from "lucide-react";
import type { GolfScore } from "@/modules/scores/service";

interface ScorePerformanceCardProps {
  scores: GolfScore[];
  isSubscriber: boolean;
}

export function ScorePerformanceCard({
  scores,
  isSubscriber,
}: ScorePerformanceCardProps) {
  const scoreCount = scores.length;
  const isQualified = scoreCount >= 5;

  const avgScore =
    scoreCount > 0
      ? (scores.reduce((acc, curr) => acc + curr.score, 0) / scoreCount).toFixed(1)
      : null;

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Trophy className="h-4 w-4 text-brand-emerald-400" />
            <span>Golf Performance</span>
          </div>
          <Badge
            variant={isQualified ? "active" : "outline"}
            className={
              isQualified
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs font-bold"
                : "border-slate-800 text-slate-400 text-xs"
            }
          >
            {scoreCount}/5 Rounds
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-bold text-white tracking-tight">
            {isQualified ? "5-Score Rolling Active" : `${5 - scoreCount} More Needed`}
          </div>
          <p className="text-xs text-slate-300">
            {avgScore
              ? `Average: ${avgScore} Stableford pts across ${scoreCount} round(s)`
              : "No Stableford rounds recorded yet"}
          </p>
        </div>

        {/* Score Mini-Cards */}
        <div className="grid grid-cols-5 gap-1.5 pt-2">
          {[0, 1, 2, 3, 4].map((slotIdx) => {
            const scoreItem = scores[slotIdx];
            return (
              <div
                key={slotIdx}
                className={`h-12 rounded-xl border flex flex-col items-center justify-center transition ${
                  scoreItem
                    ? "bg-brand-navy-900/80 border-brand-emerald-500/30 text-brand-emerald-400 font-bold"
                    : "bg-slate-950/40 border-dashed border-slate-800 text-slate-600"
                }`}
              >
                {scoreItem ? (
                  <>
                    <span className="text-sm font-mono">{scoreItem.score}</span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(scoreItem.played_on).toLocaleDateString(undefined, {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-mono text-slate-600">--</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="w-full text-xs h-9 gap-1">
          <Link href="/dashboard/scores">
            <span>Manage Scores</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
