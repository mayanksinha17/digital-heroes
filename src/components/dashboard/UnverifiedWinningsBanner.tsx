import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { Trophy, AlertCircle, ArrowRight, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WinnerWithDetails } from "@/modules/winners/types";

interface UnverifiedWinningsBannerProps {
  unverifiedWins: WinnerWithDetails[];
}

export function UnverifiedWinningsBanner({
  unverifiedWins,
}: UnverifiedWinningsBannerProps) {
  if (unverifiedWins.length === 0) return null;

  const primaryWin = unverifiedWins[0];
  const isRejected = primaryWin.verification_status === "rejected";
  const prizeFormatted = formatMoney(Number(primaryWin.prize_cents));

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 relative overflow-hidden border shadow-2xl transition ${
        isRejected
          ? "bg-gradient-to-br from-rose-950/80 via-brand-navy-900 to-brand-navy-950 border-rose-500/40 shadow-rose-500/10"
          : "bg-gradient-to-br from-brand-copper-950/90 via-brand-navy-900 to-brand-navy-950 border-brand-copper-500/40 shadow-brand-copper-500/10"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${
              isRejected
                ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                : "bg-brand-copper-500/20 border-brand-copper-500/50 text-brand-copper-300"
            }`}
          >
            {isRejected ? <AlertCircle className="w-7 h-7" /> : <Trophy className="w-7 h-7" />}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isRejected
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                    : "bg-brand-copper-500/20 border-brand-copper-500/40 text-brand-copper-300"
                }`}
              >
                {isRejected ? "Proof Needs Attention" : "Action Required · Unclaimed Prize"}
              </span>
              {unverifiedWins.length > 1 && (
                <span className="text-xs text-slate-400 font-semibold">
                  (+{unverifiedWins.length - 1} other prize)
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              You won {prizeFormatted} in the {primaryWin.draw?.draw_month || "Monthly"} Draw!
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {isRejected
                ? primaryWin.review_note
                  ? `Previous submission feedback: "${primaryWin.review_note}". Please upload an updated screenshot.`
                  : "Your previous proof was not approved. Please upload a clear scorecard screenshot to claim your cash payout."
                : "Submit a screenshot of your round scores from your club or scoring platform to verify your Stableford numbers and receive your cash disbursement."}
            </p>
          </div>
        </div>

        <div className="flex sm:shrink-0">
          <Button
            asChild
            size="lg"
            className={`w-full sm:w-auto font-bold gap-2 text-sm shadow-xl ${
              isRejected
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-brand-copper-500 hover:bg-brand-copper-600 text-slate-950"
            }`}
          >
            <Link href="/dashboard/winnings">
              <Upload className="w-4 h-4" />
              <span>{isRejected ? "Re-upload Score Proof" : "Submit Proof to Claim Prize"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
