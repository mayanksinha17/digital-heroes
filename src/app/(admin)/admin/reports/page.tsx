import { requireAdmin } from "@/modules/auth/guards";
import { AdminService } from "@/modules/admin/service";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ShieldCheck, CreditCard, Heart, Trophy, Filter } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports & Audit Logs | Admin Console",
  description: "Financial ledgers, platform accounting reconciliation, and security audit log trail.",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams?: { entity?: string };
}) {
  await requireAdmin();
  const entityType = searchParams?.entity || undefined;

  const metrics = await AdminService.getDashboardMetrics();
  const { logs, totalCount } = await AdminService.getAuditLogs({
    entityType: entityType || undefined,
    limit: 100,
  });

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Reports & Compliance Ledger</h1>
            <p className="text-xs text-slate-400">
              Audit trail for financial reconciliation, state transitions, and administrative operations
            </p>
          </div>
        </div>
      </div>

      {/* Financial Accounting Reconciliation Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            Gross Subscription Revenue
          </span>
          <div className="text-2xl font-black text-white">
            {formatMoney(metrics.finances.totalGrossRevenueCents)}
          </div>
          <p className="text-[11px] text-slate-400">
            Direct customer billing via Stripe subscriptions
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-card space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            Charity Allocation Total
          </span>
          <div className="text-2xl font-black text-rose-400">
            {formatMoney(metrics.finances.totalCharityContributionsCents)}
          </div>
          <p className="text-[11px] text-slate-400">
            Min 10% guaranteed charity distribution ledger
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-card space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Total Prize Pools Created
          </span>
          <div className="text-2xl font-black text-amber-300">
            {formatMoney(metrics.finances.totalPrizePoolsCents)}
          </div>
          <p className="text-[11px] text-slate-400">
            50% monthly share allocated to 5, 4, and 3 matches
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-card space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified Paid Disbursements
          </span>
          <div className="text-2xl font-black text-emerald-400">
            {formatMoney(metrics.finances.totalPaidDisbursedCents)}
          </div>
          <p className="text-[11px] text-slate-400">
            Cash winnings verified and marked paid
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">System Audit Log ({totalCount} entries)</h2>
            <p className="text-xs text-slate-400">
              Immutable record of all privileged mutations, draw actions, and winner payouts
            </p>
          </div>

          {/* Entity Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex rounded-xl bg-brand-navy-900 p-1 border border-white/10 text-xs">
              <a
                href="/admin/reports"
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  !entityType ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                All
              </a>
              <a
                href="/admin/reports?entity=draws"
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  entityType === "draws" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Draws
              </a>
              <a
                href="/admin/reports?entity=draw_winners"
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  entityType === "draw_winners" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Winners
              </a>
              <a
                href="/admin/reports?entity=charities"
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  entityType === "charities" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Charities
              </a>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 pr-4">Timestamp</th>
                <th className="pb-3 px-4">Actor</th>
                <th className="pb-3 px-4">Action</th>
                <th className="pb-3 px-4">Entity</th>
                <th className="pb-3 px-4">Entity ID</th>
                <th className="pb-3 pl-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 pr-4 font-mono text-slate-400">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {log.actorEmail || log.actorId || "System"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 capitalize">{log.entityType}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 truncate max-w-[140px]">
                    {log.entityId || "--"}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    {log.afterData ? (
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                        {JSON.stringify(log.afterData).slice(0, 30)}...
                      </span>
                    ) : (
                      <span className="text-slate-600">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            No audit log records found for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
