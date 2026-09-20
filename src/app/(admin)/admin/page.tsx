import { requireAdmin } from "@/modules/auth/guards";
import { AdminService } from "@/modules/admin/service";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Trophy,
  Heart,
  Award,
  CreditCard,
  FileText,
  Plus,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Command Center | Digital Heroes",
  description: "Platform overview, real-time subscriber metrics, draw controls, and financial ledgers.",
};

export default async function AdminOverviewPage() {
  const viewer = await requireAdmin();
  const metrics = await AdminService.getDashboardMetrics();
  const { logs: recentLogs } = await AdminService.getAuditLogs({ limit: 6 });

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-brand-navy-900 to-brand-navy-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Platform Operations
              </span>
              <Badge variant="gold" className="text-[10px] py-0">
                Live Postgres Aggregation
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Executive Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Monitor active subscribers, monthly draw simulations, verified prize disbursements, and charity allocations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Link href="/admin/draws/new">
                <Plus className="w-4 h-4" />
                <span>New Monthly Draw</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-800 text-slate-300 hover:text-white"
            >
              <Link href="/admin/winners">
                <Award className="w-4 h-4 mr-1.5 text-brand-copper-300" />
                <span>Review Queue ({metrics.winners.pendingReview})</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 6 Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Users & Subscribers */}
        <div className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-emerald-400" />
                Subscriber Base
              </span>
              <Badge variant="active" className="text-xs">
                {metrics.users.active} Active
              </Badge>
            </div>
            <div className="text-3xl font-black text-white">{metrics.users.total}</div>
            <p className="text-xs text-slate-400">
              Total registered accounts across subscribers and non-subscribers.
            </p>
          </div>
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
            <span>Past Due: {metrics.users.pastDue}</span>
            <span>Canceled: {metrics.users.canceled}</span>
            <Link href="/admin/users" className="text-amber-400 hover:underline font-semibold">
              View Users →
            </Link>
          </div>
        </div>

        {/* Card 2: Revenue & Invoices */}
        <div className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Gross Revenue
              </span>
              <span className="text-xs text-slate-400 font-mono">INR</span>
            </div>
            <div className="text-3xl font-black text-white">
              {formatMoney(metrics.finances.totalGrossRevenueCents)}
            </div>
            <p className="text-xs text-slate-400">
              Direct billing invoices generated via Stripe subscription payments.
            </p>
          </div>
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
            <span>Direct Donations:</span>
            <span className="font-semibold text-emerald-400">
              {formatMoney(metrics.finances.totalDirectDonationsCents)}
            </span>
          </div>
        </div>

        {/* Card 3: Charitable Impact */}
        <div className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                Charity Allocations
              </span>
              <Badge variant="outline" className="text-xs text-rose-300 border-rose-500/30">
                10%+ Floor
              </Badge>
            </div>
            <div className="text-3xl font-black text-rose-400">
              {formatMoney(metrics.finances.totalCharityContributionsCents)}
            </div>
            <p className="text-xs text-slate-400">
              Cumulative funds directed to partner charities through subscriber percentages.
            </p>
          </div>
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
            <Link href="/admin/charities" className="text-amber-400 hover:underline font-semibold">
              Manage Charities →
            </Link>
          </div>
        </div>

        {/* Card 4: Prize Pools & Rollover */}
        <div className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Total Prize Pools
              </span>
              <span className="text-xs font-semibold text-amber-400">50% Share</span>
            </div>
            <div className="text-3xl font-black text-amber-300">
              {formatMoney(metrics.finances.totalPrizePoolsCents)}
            </div>
            <p className="text-xs text-slate-400">
              Total monthly pools awarded across 5, 4, and 3-number match tiers.
            </p>
          </div>
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
            <span>Active Rollover:</span>
            <span className="font-semibold text-brand-copper-300">
              {formatMoney(metrics.draws.currentRolloverCents)}
            </span>
          </div>
        </div>

        {/* Card 5: Disbursed Payouts */}
        <div className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Disbursed Payouts
              </span>
              <Badge variant="active" className="text-xs">
                {metrics.winners.paid} Paid
              </Badge>
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {formatMoney(metrics.finances.totalPaidDisbursedCents)}
            </div>
            <p className="text-xs text-slate-400">
              Total verified winnings marked paid and disbursed to winners.
            </p>
          </div>
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
            <span>Pending Payout:</span>
            <span className="font-semibold text-amber-400">
              {formatMoney(metrics.finances.totalPendingPayoutsCents)}
            </span>
          </div>
        </div>

        {/* Card 6: Winner Verification Status */}
        <div className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-brand-copper-300" />
                Winner Review Queue
              </span>
              <Badge
                variant={metrics.winners.pendingReview > 0 ? "gold" : "outline"}
                className="text-xs"
              >
                {metrics.winners.pendingReview} Pending
              </Badge>
            </div>
            <div className="text-3xl font-black text-white">{metrics.winners.total}</div>
            <p className="text-xs text-slate-400">
              Total winning records across published monthly draws.
            </p>
          </div>
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
            <span>Awaiting: {metrics.winners.awaitingProof}</span>
            <span>Approved: {metrics.winners.approved}</span>
            <Link href="/admin/winners" className="text-amber-400 hover:underline font-semibold">
              Review Queue →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/draws"
          className="p-5 rounded-2xl glass-card hover:border-amber-500/40 transition group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <Trophy className="w-6 h-6 text-amber-400 group-hover:scale-110 transition" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Draws & Simulation</h3>
            <p className="text-xs text-slate-400">
              {metrics.draws.published} published, {metrics.draws.draft + metrics.draws.simulated} active drafts
            </p>
          </div>
        </Link>

        <Link
          href="/admin/winners"
          className="p-5 rounded-2xl glass-card hover:border-amber-500/40 transition group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <Award className="w-6 h-6 text-brand-copper-300 group-hover:scale-110 transition" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Winner Verification</h3>
            <p className="text-xs text-slate-400">
              Inspect scorecards, approve proof, and mark payouts
            </p>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="p-5 rounded-2xl glass-card hover:border-amber-500/40 transition group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <Users className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">User Management</h3>
            <p className="text-xs text-slate-400">
              Inspect subscriber accounts, 5-score rounds, and history
            </p>
          </div>
        </Link>

        <Link
          href="/admin/reports"
          className="p-5 rounded-2xl glass-card hover:border-amber-500/40 transition group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <FileText className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Financial & Audit Reports</h3>
            <p className="text-xs text-slate-400">
              System ledger reconciliation and audit event trail
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Audit Log Snapshot */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Recent Administrative Audit Trail</h2>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs h-8">
            <Link href="/admin/reports">View Full Audit Log</Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 pr-4">Timestamp</th>
                <th className="pb-3 px-4">Actor</th>
                <th className="pb-3 px-4">Action</th>
                <th className="pb-3 px-4">Entity Type</th>
                <th className="pb-3 pl-4 text-right">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 pr-4 font-mono text-slate-400">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {log.actorEmail || log.actorId || "System"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-amber-300 font-bold">{log.action}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 capitalize">{log.entityType}</td>
                  <td className="py-3 pl-4 text-right font-mono text-slate-400 truncate max-w-[120px]">
                    {log.entityId || "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
