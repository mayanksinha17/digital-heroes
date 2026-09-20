import { requireAdmin } from "@/modules/auth/guards";
import { WinnerService } from "@/modules/winners/service";
import { WinnerReviewQueue } from "@/components/admin/WinnerReviewQueue";
import { formatMoney } from "@/lib/money";
import { Trophy, ShieldCheck, CreditCard, Clock } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Winner Verification & Payout Queue | Digital Heroes Admin",
  description: "Review winner scorecard proofs, approve or reject submissions, and manage payout disbursements.",
};

export default async function AdminWinnersPage() {
  await requireAdmin();
  const winners = await WinnerService.getAdminWinnerQueue();

  const totalPrizeCents = winners.reduce((acc, curr) => acc + Number(curr.prize_cents), 0);
  const pendingReviewCount = winners.filter((w) => w.verification_status === "pending_review").length;
  const readyPayoutCount = winners.filter(
    (w) => w.verification_status === "approved" && w.payment_status === "pending"
  ).length;
  const paidCount = winners.filter((w) => w.payment_status === "paid").length;

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-emerald-950/80 border border-brand-emerald-500/40 text-brand-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Winner Verification & Payouts
              </h1>
              <p className="text-xs text-slate-400">
                PRD §09 & §11 Surface 04 · Score proof review and payout reconciliation
              </p>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Prizes Awarded
            </span>
            <div className="text-2xl font-bold text-white">{formatMoney(totalPrizeCents)}</div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Pending Review
            </span>
            <div className="text-2xl font-bold text-amber-400">{pendingReviewCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-copper-300">
              Ready for Payout
            </span>
            <div className="text-2xl font-bold text-brand-copper-300">{readyPayoutCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-navy-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              Disbursed (Paid)
            </span>
            <div className="text-2xl font-bold text-emerald-400">{paidCount}</div>
          </div>
        </div>
      </div>

      {/* Queue Component */}
      <WinnerReviewQueue initialWinners={winners} />
    </div>
  );
}
