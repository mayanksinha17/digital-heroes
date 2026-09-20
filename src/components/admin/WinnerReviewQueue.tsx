"use client";

import React, { useState, useTransition } from "react";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  adminReviewWinnerAction,
  adminMarkWinnerPaidAction,
} from "@/modules/winners/actions";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import type { WinnerWithDetails } from "@/modules/winners/types";

interface WinnerReviewQueueProps {
  initialWinners: WinnerWithDetails[];
}

export function WinnerReviewQueue({ initialWinners }: WinnerReviewQueueProps) {
  const [winners, setWinners] = useState<WinnerWithDetails[]>(initialWinners);
  const [filter, setFilter] = useState<string>("all");
  const [selectedWinner, setSelectedWinner] = useState<WinnerWithDetails | null>(null);
  const [reviewNote, setReviewNote] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredWinners = winners.filter((w) => {
    if (filter === "pending_review") return w.verification_status === "pending_review";
    if (filter === "awaiting_proof") return w.verification_status === "awaiting_proof";
    if (filter === "approved") return w.verification_status === "approved";
    if (filter === "pending_payout")
      return w.verification_status === "approved" && w.payment_status === "pending";
    if (filter === "paid") return w.payment_status === "paid";
    return true;
  });

  const handleReview = (winnerId: string, status: "approved" | "rejected") => {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await adminReviewWinnerAction(winnerId, status, reviewNote);
      if (!res.success) {
        setErrorMessage(res.error || `Failed to ${status} winner`);
        return;
      }

      setSuccessMessage(`Winner verification ${status} successfully.`);
      setWinners(
        winners.map((w) =>
          w.id === winnerId
            ? {
                ...w,
                verification_status: status,
                review_note: reviewNote || null,
              }
            : w
        )
      );
      setSelectedWinner(null);
      setReviewNote("");
    });
  };

  const handleMarkPaid = (winnerId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await adminMarkWinnerPaidAction(winnerId);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to mark payout as paid");
        return;
      }

      setSuccessMessage("Payout marked as Paid and recorded in audit log.");
      setWinners(
        winners.map((w) =>
          w.id === winnerId
            ? {
                ...w,
                payment_status: "paid",
                paid_at: new Date().toISOString(),
              }
            : w
        )
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap pb-2 border-b border-slate-800">
        {[
          { id: "all", label: "All Winners" },
          { id: "pending_review", label: "Pending Review" },
          { id: "approved", label: "Approved" },
          { id: "pending_payout", label: "Ready for Payout" },
          { id: "paid", label: "Paid" },
          { id: "awaiting_proof", label: "Awaiting Proof" },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={filter === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(tab.id)}
            className={`text-xs ${
              filter === tab.id
                ? "bg-emerald-500 text-slate-950 font-semibold"
                : "border-slate-800 text-slate-300"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Messages */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="default" className="border-emerald-500/40 bg-emerald-950/20 text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Winners Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Winner</th>
                <th className="p-4">Draw Month</th>
                <th className="p-4">Tier & Prize</th>
                <th className="p-4">Proof Status</th>
                <th className="p-4">Payout</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredWinners.length > 0 ? (
                filteredWinners.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white">
                        {w.profile?.full_name || "Winner"}
                      </div>
                      <div className="text-xs text-slate-400">{w.profile?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs text-slate-300">
                        {w.draw?.draw_month || "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-emerald-400">
                        {formatMoney(w.prize_cents)}
                      </div>
                      <Badge
                        variant={w.tier === 5 ? "gold" : "active"}
                        className="text-[10px] py-0 px-1.5"
                      >
                        Tier {w.tier} ({w.tier}-Match)
                      </Badge>
                    </td>
                    <td className="p-4">
                      {w.verification_status === "approved" ? (
                        <Badge variant="active" className="text-xs">Approved</Badge>
                      ) : w.verification_status === "pending_review" ? (
                        <Badge variant="pending" className="text-xs">Under Review ({w.proof_attempts}/3)</Badge>
                      ) : w.verification_status === "rejected" ? (
                        <Badge variant="destructive" className="text-xs">Rejected</Badge>
                      ) : (
                        <Badge variant="inactive" className="text-xs">Awaiting Proof</Badge>
                      )}

                      {/* Submitted Proof links */}
                      {w.proofs && w.proofs.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {w.proofs.map((p) => (
                            <a
                              key={p.id}
                              href={p.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                            >
                              Proof #{p.attempt_no} <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {w.payment_status === "paid" ? (
                        <Badge variant="active" className="text-xs">Paid</Badge>
                      ) : (
                        <Badge variant="pending" className="text-xs">Pending</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {w.verification_status === "pending_review" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedWinner(w)}
                          className="border-slate-700 text-xs h-8"
                        >
                          Review Proof
                        </Button>
                      )}

                      {w.verification_status === "approved" && w.payment_status === "pending" && (
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleMarkPaid(w.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs h-8"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" /> Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No winner records found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal Dialog */}
      {selectedWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Review Winner Proof</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWinner(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                <strong>Winner:</strong> {selectedWinner.profile?.full_name} ({selectedWinner.profile?.email})
              </p>
              <p>
                <strong>Prize:</strong> {formatMoney(selectedWinner.prize_cents)} (Tier {selectedWinner.tier})
              </p>
              <p>
                <strong>Submitted Proof Files:</strong>
              </p>
              <div className="flex gap-2 flex-wrap">
                {selectedWinner.proofs?.map((p) => (
                  <a
                    key={p.id}
                    href={p.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 hover:underline flex items-center gap-1.5"
                  >
                    Open Proof #{p.attempt_no} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="reviewNote" className="text-xs font-medium text-slate-300">
                Review Feedback / Note (Optional if approved, required if rejected):
              </label>
              <textarea
                id="reviewNote"
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Approved - verified against round scorecard. Or: Screenshot unclear, please re-upload."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedWinner(null)}
                className="border-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => handleReview(selectedWinner.id, "rejected")}
                className="bg-rose-600 hover:bg-rose-700 text-xs"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Proof
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => handleReview(selectedWinner.id, "approved")}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve Proof
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
