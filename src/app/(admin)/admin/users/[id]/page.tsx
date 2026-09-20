import { requireAdmin } from "@/modules/auth/guards";
import { AdminService } from "@/modules/admin/service";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Users,
  ArrowLeft,
  CreditCard,
  Heart,
  Trophy,
  Award,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "User Profile Inspection | Admin Console",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const user = await AdminService.getUserDetail(params.id);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back to User Directory */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
          <Link href="/admin/users">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Users Directory</span>
          </Link>
        </Button>
      </div>

      {/* User Header Profile Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 font-semibold">User ID: {user.id}</span>
              <Badge variant={user.role === "admin" ? "gold" : "outline"} className="text-xs">
                {user.role.toUpperCase()}
              </Badge>
              <Badge
                variant={user.subscriptionStatus === "active" ? "active" : "outline"}
                className="text-xs capitalize"
              >
                {user.subscriptionStatus}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {user.fullName || "Unnamed Golfer"}
            </h1>
            <p className="text-sm font-mono text-slate-300">{user.email}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-brand-navy-900/80 border border-white/5 p-4 rounded-2xl">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Total Won
              </span>
              <div className="text-xl font-black text-white">{formatMoney(user.totalWonCents)}</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Scores
              </span>
              <div className="text-xl font-black text-emerald-400">{user.scoreCount}/5</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Information Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Subscription & Billing Info */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Subscription & Billing Details</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Subscription Status:</span>
              <span className="font-bold text-white capitalize">{user.subscriptionStatus}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Plan Code:</span>
              <span className="font-bold text-white capitalize">{user.planCode || "None"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Current Period End:</span>
              <span className="font-bold text-white">
                {user.currentPeriodEnd ? formatDate(user.currentPeriodEnd) : "--"}
              </span>
            </div>
          </div>

          {/* Payment Invoices */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Invoice Payments & Charity Allocations ({user.paymentLedger.length})
            </h4>
            {user.paymentLedger.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {user.paymentLedger.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-brand-navy-900/60 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-white">{formatMoney(p.grossCents)}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(p.paidAt)}</span>
                    </div>
                    <span className="text-emerald-400 font-semibold text-[11px]">
                      {formatMoney(p.charityCents)} to Charity
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No payment invoices recorded.</p>
            )}
          </div>
        </div>

        {/* Module 2: Charity Selection */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Charity Partner & Giving</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Designated Charity:</span>
              <span className="font-bold text-white">{user.charityName || "None Selected"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Contribution Rate:</span>
              <span className="font-bold text-rose-400">{user.charityPercent}% of subscription fee</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column: Scores History & Winnings History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scores */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Rolling 5-Score Rounds ({user.scores.length})</span>
            </div>
          </div>

          {user.scores.length > 0 ? (
            <div className="space-y-2">
              {user.scores.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-brand-navy-900/60 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 font-bold">#{idx + 1}</span>
                    <span className="font-bold text-white">{formatDate(s.playedOn)}</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                    {s.score} pts
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No golf scores recorded yet.</p>
          )}
        </div>

        {/* Winnings */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
              <Award className="w-4 h-4 text-brand-copper-300" />
              <span>Prize Winnings ({user.winnings.length})</span>
            </div>
          </div>

          {user.winnings.length > 0 ? (
            <div className="space-y-2">
              {user.winnings.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl bg-brand-navy-900/60 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">Tier {w.tier} · {w.drawMonth} Draw</div>
                    <div className="text-[11px] text-slate-400">
                      Status: {w.verificationStatus} · Payment: {w.paymentStatus}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sm text-white">
                    {formatMoney(w.prizeCents)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No prize winnings recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
