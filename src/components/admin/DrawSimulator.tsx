"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminSimulateDrawAction, adminPublishDrawAction } from "@/modules/draws/actions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Trophy,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Award,
} from "lucide-react";
import type { DrawRow, DrawSimulationRow } from "@/modules/draws/types";
import type { DrawResult } from "@/modules/draws/engine";

interface DrawSimulatorProps {
  draw: DrawRow;
  simulations: DrawSimulationRow[];
}

export function DrawSimulator({ draw, simulations }: DrawSimulatorProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<"random" | "algorithmic">(draw.mode || "random");
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestSimResult, setLatestSimResult] = useState<DrawResult | null>(
    simulations[0]?.result ? (simulations[0].result as unknown as DrawResult) : null
  );
  const [activeSimId, setActiveSimId] = useState<string | null>(simulations[0]?.id || null);

  const isPublished = draw.status === "published";

  async function handleSimulate() {
    setIsSimulating(true);
    setError(null);

    const res = await adminSimulateDrawAction(draw.id, selectedMode);
    setIsSimulating(false);

    if (!res.success) {
      setError(res.error || "Simulation failed");
      return;
    }

    if (res.data) {
      setLatestSimResult(res.data.result);
      setActiveSimId(res.data.simulation.id);
      router.refresh();
    }
  }

  async function handlePublish() {
    if (!activeSimId) {
      setError("Please run a simulation before publishing");
      return;
    }

    if (!window.confirm("Publishing will finalize the draw, lock drawn numbers, and create permanent winner records. This action cannot be reversed. Proceed?")) {
      return;
    }

    setIsPublishing(true);
    setError(null);

    const res = await adminPublishDrawAction(draw.id, activeSimId);
    setIsPublishing(false);

    if (!res.success) {
      setError(res.error || "Publish failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Simulation Trigger & Mode Selection Card */}
      {!isPublished ? (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-amber-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Phase 6 Engine Simulator
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">Run Draw Simulation</h2>
              <p className="text-xs text-slate-400">
                Simulate match algorithms against all qualified 5-score subscriber entries without committing publication.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex rounded-xl bg-brand-navy-900 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedMode("random")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedMode === "random"
                      ? "bg-amber-500 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Random (Lottery)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode("algorithmic")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedMode === "algorithmic"
                      ? "bg-amber-500 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Algorithmic (Weighted)
                </button>
              </div>

              <Button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2 shadow-lg"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Simulating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Run Simulation</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 bg-emerald-950/10 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5" />
            <span>Draw Successfully Published & Snapshot Locked</span>
          </div>
          <p className="text-xs text-slate-300">
            This draw is immutable. Winner records have been assigned and score snapshots are permanent.
          </p>
        </div>
      )}

      {/* Simulation Result Preview */}
      {latestSimResult && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-emerald-400">
                Simulation Results Preview
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Drawn Numbers & Prize Allocations
              </h3>
            </div>

            {!isPublished && activeSimId && (
              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 shadow-xl shadow-emerald-500/20"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Publish Draw (Atomic Transaction)</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {/* 5 Drawn Numbers */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              5 Drawn Numbers:
            </span>
            <div className="flex items-center gap-3">
              {latestSimResult.drawnNumbers.map((num, idx) => (
                <div
                  key={idx}
                  className="h-14 w-14 rounded-2xl bg-gradient-to-b from-brand-emerald-950 to-brand-navy-900 border border-brand-emerald-500/50 flex items-center justify-center text-xl font-mono font-black text-brand-emerald-400 shadow-inner"
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          {/* Tier Distribution Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tier 1 (5 Matches - 40%) */}
            <div className="p-5 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Tier 1 (5 Matches)
                </span>
                <span className="text-xs font-mono text-slate-400">40% Pool</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatMoney(latestSimResult.tierPools.pool5Cents)}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-white/5">
                <span>Winners: {latestSimResult.winners.filter((w) => w.tier === 5).length}</span>
                <span className="text-brand-copper-300 font-semibold">
                  {latestSimResult.winners.filter((w) => w.tier === 5).length === 0
                    ? "Rolls Over"
                    : `${formatMoney(latestSimResult.allocation.tierAllocations[5]?.payoutPerWinnerCents || 0)} each`}
                </span>
              </div>
            </div>

            {/* Tier 2 (4 Matches - 35%) */}
            <div className="p-5 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Tier 2 (4 Matches)
                </span>
                <span className="text-xs font-mono text-slate-400">35% Pool</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatMoney(latestSimResult.tierPools.pool4Cents)}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-white/5">
                <span>Winners: {latestSimResult.winners.filter((w) => w.tier === 4).length}</span>
                <span className="text-emerald-400 font-semibold">
                  {latestSimResult.winners.filter((w) => w.tier === 4).length === 0
                    ? "Unallocated"
                    : `${formatMoney(latestSimResult.allocation.tierAllocations[4]?.payoutPerWinnerCents || 0)} each`}
                </span>
              </div>
            </div>

            {/* Tier 3 (3 Matches - 25%) */}
            <div className="p-5 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tier 3 (3 Matches)
                </span>
                <span className="text-xs font-mono text-slate-400">25% Pool</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatMoney(latestSimResult.tierPools.pool3Cents)}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-white/5">
                <span>Winners: {latestSimResult.winners.filter((w) => w.tier === 3).length}</span>
                <span className="text-emerald-400 font-semibold">
                  {latestSimResult.winners.filter((w) => w.tier === 3).length === 0
                    ? "Unallocated"
                    : `${formatMoney(latestSimResult.allocation.tierAllocations[3]?.payoutPerWinnerCents || 0)} each`}
                </span>
              </div>
            </div>
          </div>

          {/* Simulation Winners List Snapshot */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">
                Simulation Winning Participants ({latestSimResult.winners.length})
              </h4>
              <span className="text-xs text-slate-400">
                Rollover Out: {formatMoney(latestSimResult.allocation.rolloverOutCents)}
              </span>
            </div>

            {latestSimResult.winners.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-2">User ID</th>
                      <th className="pb-2">Tier</th>
                      <th className="pb-2">Matches</th>
                      <th className="pb-2">Matched Numbers</th>
                      <th className="pb-2 text-right">Individual Prize</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {latestSimResult.winners.map((w, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 font-mono text-slate-300">{w.userId}</td>
                        <td className="py-2.5">
                          <Badge variant={w.tier === 5 ? "gold" : "outline"} className="text-[10px]">
                            Tier {w.tier}
                          </Badge>
                        </td>
                        <td className="py-2.5 font-bold text-white">{w.matchCount} numbers</td>
                        <td className="py-2.5 font-mono text-emerald-400">
                          {w.matchedNumbers.join(", ")}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-white">
                          {formatMoney(w.prizeCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-brand-navy-900/40 rounded-2xl border border-white/5">
                No participants matched 3, 4, or 5 numbers in this simulation. Tier 1 jackpot pool will carry forward to next month&apos;s rollover.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
