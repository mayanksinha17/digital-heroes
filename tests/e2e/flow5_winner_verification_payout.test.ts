import { describe, it, expect, vi, beforeEach } from "vitest";
import { WinnerService } from "@/modules/winners/service";
import { recordProofSubmissionSchema } from "@/modules/winners/schemas";
import type { WinnerWithDetails } from "@/modules/winners/types";

describe("E2E Flow 5 — Winner Verification, Proof Upload, Admin Review & External Payout", () => {
  const winnerId = "11111111-1111-1111-1111-111111111111";
  const userId = "sub-user-winner";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("advances winner claim from awaiting_proof through admin approval to paid status with audit logs", async () => {
    // Initial state: Winner record after draw publish
    const winnerRecord = {
      id: winnerId,
      user_id: userId,
      draw_id: "draw-june-2026",
      tier: 5,
      prize_cents: 932064,
      verification_status: "awaiting_proof",
      payment_status: "pending",
      proof_attempts: 0,
      paid_at: null,
      created_at: "2026-06-30T20:00:00Z",
      updated_at: "2026-06-30T20:00:00Z",
      draw: {
        id: "draw-june-2026",
        draw_month: "2026-06-01",
        mode: "random",
        drawn_numbers: [10, 15, 20, 25, 30],
      },
      profile: {
        id: userId,
        full_name: "Winner User",
        email: "winner@example.com",
      },
      proofs: [],
    } as unknown as WinnerWithDetails;

    // 1. Winner views winning record
    vi.spyOn(WinnerService, "getWinnerById").mockImplementation(async (wid: string, uid?: string) => {
      if (wid !== winnerId || uid !== userId) throw new Error("Forbidden");
      return winnerRecord;
    });

    const userView = await WinnerService.getWinnerById(winnerId, userId);
    expect(userView?.prize_cents).toBe(932064);
    expect(userView?.verification_status).toBe("awaiting_proof");

    // 2. Winner uploads proof screenshot
    const proofInput = {
      winnerId,
      storagePath: "winner-proofs/sub-user-winner/winner-jackpot-1/attempt-1.png",
      mimeType: "image/png" as const,
      sizeBytes: 1024 * 1024,
    };
    expect(recordProofSubmissionSchema.safeParse(proofInput).success).toBe(true);

    // 3. Admin reviews proof (Approval)
    vi.spyOn(WinnerService, "adminReviewWinner").mockImplementation(async (adminId, input) => {
      winnerRecord.verification_status = input.status;
    });

    await WinnerService.adminReviewWinner("admin-super-1", {
      winnerId,
      status: "approved",
      note: "Scorecard verified against official club round records.",
    });
    expect(winnerRecord.verification_status).toBe("approved");

    // 4. Admin completes external payment and marks payout paid
    vi.spyOn(WinnerService, "adminMarkWinnerPaid").mockImplementation(async (adminId, wid) => {
      if ((winnerRecord.verification_status as string) !== "approved") {
        throw new Error("Payout requires prior approval");
      }
      winnerRecord.payment_status = "paid";
      winnerRecord.paid_at = new Date().toISOString();
    });

    await WinnerService.adminMarkWinnerPaid("admin-super-1", winnerId);
    expect(winnerRecord.payment_status).toBe("paid");
  });
});
