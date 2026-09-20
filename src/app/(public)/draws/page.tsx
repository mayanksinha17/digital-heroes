import { DrawService } from "@/modules/draws/service";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trophy, Sparkles, ArrowRight, ShieldCheck, History } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Official Draw Results | Digital Heroes",
  description:
    "View published monthly draw results, winning Stableford numbers, prize pool distributions, and jackpot rollover history.",
};

export default async function PublicDrawsPage() {
  const allDraws = await DrawService.getDraws();
  const publishedDraws = allDraws.filter((d) => d.status === "published");

  return (
    <div className="space-y-12 py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-4 py-1.5 text-xs font-semibold text-amber-400">
          <Trophy className="w-3.5 h-3.5" />
          <span>Official Public Ledger</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Monthly Draw Results & Prize Pools
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Verifiable monthly draw results. Every published draw locks 5 winning numbers, participant snapshots, and cash prize pool distributions.
        </p>
      </div>

      {/* Published Draws List */}
      <div className="space-y-6">
        {publishedDraws.length > 0 ? (
          publishedDraws.map((draw) => (
            <div
              key={draw.id}
              className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-white/10 hover:border-amber-500/30 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Official Monthly Draw
                    </span>
                    <Badge variant="active" className="text-[10px]">
                      Published
                    </Badge>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {draw.draw_month} Draw Results
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400">Total Prize Pool:</span>
                  <div className="text-2xl font-black text-amber-300">
                    {formatMoney(Number(draw.pool_total_cents || 0))}
                  </div>
                </div>
              </div>

              {/* 5 Winning Numbers */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Official Winning Numbers:
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {draw.drawn_numbers?.map((num, idx) => (
                    <div
                      key={idx}
                      className="h-12 w-12 rounded-2xl bg-brand-emerald-500/20 border border-brand-emerald-500/40 flex items-center justify-center text-lg font-mono font-black text-brand-emerald-400 shadow-sm"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pool Breakdown Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                    Tier 1 (5 Matches · 40%)
                  </span>
                  <div className="text-lg font-bold text-white">
                    {draw.pool_5_cents ? formatMoney(Number(draw.pool_5_cents)) : "--"}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    Tier 2 (4 Matches · 35%)
                  </span>
                  <div className="text-lg font-bold text-white">
                    {draw.pool_4_cents ? formatMoney(Number(draw.pool_4_cents)) : "--"}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Tier 3 (3 Matches · 25%)
                  </span>
                  <div className="text-lg font-bold text-white">
                    {draw.pool_3_cents ? formatMoney(Number(draw.pool_3_cents)) : "--"}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
                <span>Draw Mode: <strong className="text-white capitalize">{draw.mode}</strong></span>
                <span>Rollover to Next Month: <strong className="text-brand-copper-300">{formatMoney(Number(draw.rollover_out_cents || 0))}</strong></span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-16 text-center rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/30 space-y-3">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-300">First Monthly Draw Pending</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              The platform is currently accumulating subscriber entries for the active cycle. Official results and winning numbers will appear here upon publication.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="text-center space-y-4 pt-6">
        <Button
          asChild
          size="lg"
          className="bg-brand-emerald-500 hover:bg-brand-emerald-600 text-slate-950 font-bold px-8 h-12 gap-2"
        >
          <Link href="/signup">
            <span>Enter Next Monthly Draw</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
