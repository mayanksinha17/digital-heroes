import { requireAdmin } from "@/modules/auth/guards";
import { DrawService } from "@/modules/draws/service";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trophy, Plus, ArrowRight, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Draw Operations | Admin Console",
  description: "Manage monthly prize draws, execute simulations, and publish verified results.",
};

export default async function AdminDrawsPage() {
  await requireAdmin();
  const draws = await DrawService.getDraws();

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Draw Operations</h1>
            <p className="text-xs text-slate-400">
              PRD §06–§07 · 40/35/25 tier pools · Random & Algorithmic modes · Rollover tracking
            </p>
          </div>
        </div>

        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5 shadow-lg">
          <Link href="/admin/draws/new">
            <Plus className="w-4 h-4" />
            <span>Create Monthly Draw</span>
          </Link>
        </Button>
      </div>

      {/* Draws Table */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 pr-4">Month</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Mode</th>
                <th className="pb-3 px-4">Winning Numbers</th>
                <th className="pb-3 px-4 text-right">Prize Pool</th>
                <th className="pb-3 px-4 text-right">Rollover In</th>
                <th className="pb-3 px-4 text-right">Rollover Out</th>
                <th className="pb-3 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {draws.map((d) => (
                <tr key={d.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 pr-4 font-bold text-white text-sm">
                    {d.draw_month}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        d.status === "published"
                          ? "active"
                          : d.status === "simulated"
                          ? "gold"
                          : "outline"
                      }
                      className="text-[10px] capitalize"
                    >
                      {d.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 capitalize text-slate-300">
                    {d.mode}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {d.drawn_numbers ? (
                      <span className="text-emerald-400 font-bold">
                        [{d.drawn_numbers.join(", ")}]
                      </span>
                    ) : (
                      <span className="text-slate-600">Pending Draw</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                    {d.pool_total_cents ? formatMoney(Number(d.pool_total_cents)) : "--"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                    {formatMoney(Number(d.rollover_in_cents || 0))}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-brand-copper-300">
                    {d.rollover_out_cents ? formatMoney(Number(d.rollover_out_cents)) : "--"}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs border-slate-800">
                      <Link href={`/admin/draws/${d.id}`}>
                        <span>{d.status === "published" ? "View Snapshot" : "Simulate / Publish"}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {draws.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            No draws created yet. Click &quot;Create Monthly Draw&quot; above to initialize the first cycle.
          </div>
        )}
      </div>
    </div>
  );
}
