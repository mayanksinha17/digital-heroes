import { requireAdmin } from "@/modules/auth/guards";
import { DrawService } from "@/modules/draws/service";
import type { DrawResult } from "@/modules/draws/engine";
import { DrawSimulator } from "@/components/admin/DrawSimulator";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, ArrowLeft, Users, Sparkles, CheckCircle2, History } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Draw Simulator & Operations | Admin Console",
};

export default async function AdminDrawDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const draw = await DrawService.getDrawById(params.id);

  if (!draw) {
    notFound();
  }

  const simulations = await DrawService.getDrawSimulations(params.id);
  const snapshot = await DrawService.getEligibleParticipantsSnapshot();

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back to Draws */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
          <Link href="/admin/draws">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Draws</span>
          </Link>
        </Button>
      </div>

      {/* Draw Overview Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-amber-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  draw.status === "published"
                    ? "active"
                    : draw.status === "simulated"
                    ? "gold"
                    : "outline"
                }
                className="text-xs uppercase"
              >
                {draw.status}
              </Badge>
              <span className="text-xs text-slate-400 capitalize">
                Mode: <strong className="text-white">{draw.mode}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Draw Month: {draw.draw_month}
            </h1>
            <p className="text-xs text-slate-300">
              Draw ID: <span className="font-mono text-slate-400">{draw.id}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-brand-navy-900/80 border border-white/5 p-4 rounded-2xl">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Active Subscribers
              </span>
              <div className="text-xl font-black text-white">
                {draw.active_subscriber_count || snapshot.subscribers.length}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Qualified Entrants (5 Scores)
              </span>
              <div className="text-xl font-black text-emerald-400">
                {draw.entry_count || snapshot.entries.length}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Incoming Rollover
              </span>
              <div className="text-xl font-black text-brand-copper-300">
                {formatMoney(Number(draw.rollover_in_cents || 0))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Interface */}
      <DrawSimulator draw={draw} simulations={simulations} />

      {/* Simulation History Log */}
      {simulations.length > 0 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
            <History className="w-4 h-4 text-amber-400" />
            <span>Simulation Run History ({simulations.length} runs)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Mode</th>
                  <th className="pb-3">Drawn Numbers</th>
                  <th className="pb-3 text-right">Pool Total</th>
                  <th className="pb-3 text-right">Sim ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {simulations.map((sim) => (
                  <tr key={sim.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-mono text-slate-400">
                      {formatDateTime(sim.created_at)}
                    </td>
                    <td className="py-3 capitalize text-white font-semibold">{sim.mode}</td>
                    <td className="py-3 font-mono text-emerald-400 font-bold">
                      [{sim.drawn_numbers.join(", ")}]
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-white">
                      {formatMoney(((sim.result as unknown) as DrawResult | undefined)?.tierPools?.poolTotalCents || 0)}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-500 truncate max-w-[120px]">
                      {sim.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
