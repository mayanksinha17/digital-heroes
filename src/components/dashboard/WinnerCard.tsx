"use client";

import React, { useState } from "react";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProofUploader } from "./ProofUploader";
import {
  Trophy,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import type { WinnerWithDetails } from "@/modules/winners/types";

interface WinnerCardProps {
  winner: WinnerWithDetails;
}

export function WinnerCard({ winner }: WinnerCardProps) {
  const [showUploader, setShowUploader] = useState(
    winner.verification_status === "awaiting_proof" || winner.verification_status === "rejected"
  );

  const formattedMonth = winner.draw?.draw_month
    ? new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
        new Date(winner.draw.draw_month)
      )
    : "Monthly Draw";

  const tierName =
    winner.tier === 5
      ? "Tier 1: 5-Match Jackpot"
      : winner.tier === 4
      ? "Tier 2: 4-Match Prize"
      : "Tier 3: 3-Match Prize";

  const canUploadProof =
    (winner.verification_status === "awaiting_proof" || winner.verification_status === "rejected") &&
    winner.proof_attempts < 3 &&
    winner.payment_status !== "paid";

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6 border border-slate-800">
      {/* Header: Draw Month & Prize Amount */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
              winner.tier === 5
                ? "bg-brand-copper-500/20 text-brand-copper-300 border border-brand-copper-500/40"
                : "bg-brand-emerald-500/20 text-brand-emerald-400 border border-brand-emerald-500/40"
            }`}
          >
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {formattedMonth}
              </span>
              <Badge
                variant={winner.tier === 5 ? "gold" : "active"}
                className="text-[10px] py-0 px-2 uppercase font-semibold"
              >
                {tierName}
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              {formatMoney(winner.prize_cents)}
            </h3>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {winner.payment_status === "paid" ? (
            <Badge variant="active" className="text-xs px-3 py-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Payout Completed
            </Badge>
          ) : winner.verification_status === "approved" ? (
            <Badge variant="active" className="text-xs px-3 py-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified · Payout Pending
            </Badge>
          ) : winner.verification_status === "pending_review" ? (
            <Badge variant="pending" className="text-xs px-3 py-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Under Review
            </Badge>
          ) : winner.verification_status === "rejected" ? (
            <Badge variant="destructive" className="text-xs px-3 py-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Proof Rejected
            </Badge>
          ) : (
            <Badge variant="pending" className="text-xs px-3 py-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Action Required: Upload Proof
            </Badge>
          )}
        </div>
      </div>

      {/* Rejection Note Alert */}
      {winner.verification_status === "rejected" && winner.review_note && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 space-y-1">
          <p className="font-semibold text-rose-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-400" /> Administrator Feedback:
          </p>
          <p>{winner.review_note}</p>
        </div>
      )}

      {/* Proof Submission Details & History */}
      {winner.proofs && winner.proofs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Submitted Proofs
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {winner.proofs.map((proof) => (
              <div
                key={proof.id}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300"
              >
                <span>Attempt #{proof.attempt_no}</span>
                {proof.signedUrl && (
                  <a
                    href={proof.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    View File <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Area: Uploader or View Status */}
      {canUploadProof && (
        <div className="pt-2">
          <div className="flex items-center justify-between pb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Proof Upload
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUploader(!showUploader)}
              className="text-xs text-slate-400 hover:text-white h-7 px-2"
            >
              {showUploader ? (
                <span className="flex items-center gap-1">Hide <ChevronUp className="w-3.5 h-3.5" /></span>
              ) : (
                <span className="flex items-center gap-1">Upload Proof <ChevronDown className="w-3.5 h-3.5" /></span>
              )}
            </Button>
          </div>

          {showUploader && (
            <ProofUploader
              winnerId={winner.id}
              attemptNo={winner.proof_attempts + 1}
              maxAttempts={3}
            />
          )}
        </div>
      )}
    </div>
  );
}
