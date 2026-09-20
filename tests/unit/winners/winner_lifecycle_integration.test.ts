import { describe, it, expect } from "vitest";
import { AppError } from "@/lib/errors";

interface StoredWinner {
  id: string;
  drawId: string;
  userId: string;
  tier: 5 | 4 | 3;
  prizeCents: number;
  verificationStatus: "awaiting_proof" | "pending_review" | "approved" | "rejected";
  proofAttempts: number;
  reviewNote?: string | null;
  paymentStatus: "pending" | "paid";
  paidAt?: string | null;
}

interface StoredProof {
  id: string;
  winnerId: string;
  attemptNo: number;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

/**
 * Pure simulation state machine mirroring PostgreSQL DB constraints & RPCs:
 * - review_winner RPC
 * - mark_winner_paid RPC
 * - DB constraint: check (payment_status <> 'paid' or verification_status = 'approved')
 * - DB constraint: check ((payment_status = 'paid') = (paid_at is not null))
 */
class WinnerLifecycleSimulator {
  public winner: StoredWinner;
  public proofs: StoredProof[] = [];

  constructor(winnerId: string, userId: string, tier: 5 | 4 | 3, prizeCents: number) {
    this.winner = {
      id: winnerId,
      drawId: "draw-1",
      userId,
      tier,
      prizeCents,
      verificationStatus: "awaiting_proof",
      proofAttempts: 0,
      paymentStatus: "pending",
      paidAt: null,
    };
  }

  public submitProof(
    userId: string,
    mimeType: string,
    sizeBytes: number
  ): StoredProof {
    // 1. Ownership check
    if (this.winner.userId !== userId) {
      throw new AppError("FORBIDDEN", "Unauthorized", 403);
    }

    // 2. State checks
    if (this.winner.verificationStatus === "approved") {
      throw new AppError("VALIDATION_ERROR", "Already approved", 400);
    }

    if (this.winner.proofAttempts >= 3) {
      throw new AppError("PROOF_ATTEMPTS_EXCEEDED", "Max attempts exceeded", 400);
    }

    const nextAttempt = this.winner.proofAttempts + 1;
    const proof: StoredProof = {
      id: `proof-${nextAttempt}`,
      winnerId: this.winner.id,
      attemptNo: nextAttempt,
      storagePath: `${userId}/${this.winner.id}/attempt-${nextAttempt}.png`,
      mimeType,
      sizeBytes,
      uploadedAt: new Date().toISOString(),
    };

    this.proofs.push(proof);
    this.winner.proofAttempts = nextAttempt;
    this.winner.verificationStatus = "pending_review";
    return proof;
  }

  public reviewWinner(adminId: string, status: "approved" | "rejected", note?: string): void {
    if (status !== "approved" && status !== "rejected") {
      throw new AppError("VALIDATION_ERROR", "Invalid status", 400);
    }

    this.winner.verificationStatus = status;
    this.winner.reviewNote = note || null;
  }

  public markPaid(adminId: string): void {
    // DB Constraint check
    if (this.winner.verificationStatus !== "approved") {
      throw new AppError(
        "PAYOUT_NOT_APPROVED",
        "Winner proof must be approved before payout",
        400
      );
    }

    if (this.winner.paymentStatus === "paid") {
      throw new AppError("PAYOUT_ALREADY_PAID", "Already paid", 400);
    }

    this.winner.paymentStatus = "paid";
    this.winner.paidAt = new Date().toISOString();
  }
}

describe("Winner Lifecycle Integration Test (PRD §09 & §10)", () => {
  it("transitions smoothly through the entire winner verification & payout pipeline", () => {
    const winnerId = "w-001";
    const winnerUser = "golfer-123";
    const sim = new WinnerLifecycleSimulator(winnerId, winnerUser, 5, 1864128); // Tier 5 Jackpot ₹18,641.28

    // 1. Initial state after draw is published
    expect(sim.winner.verificationStatus).toBe("awaiting_proof");
    expect(sim.winner.paymentStatus).toBe("pending");
    expect(sim.winner.proofAttempts).toBe(0);

    // 2. Winner attempts premature payout -> Rejected by database invariant
    expect(() => sim.markPaid("admin-1")).toThrow(AppError);

    // 3. Winner uploads Attempt #1
    sim.submitProof(winnerUser, "image/png", 1024000);
    expect(sim.winner.verificationStatus).toBe("pending_review");
    expect(sim.winner.proofAttempts).toBe(1);
    expect(sim.proofs).toHaveLength(1);

    // 4. Admin reviews Attempt #1 and rejects due to blurry image
    sim.reviewWinner("admin-1", "rejected", "Score numbers are obscured. Please re-upload.");
    expect(sim.winner.verificationStatus).toBe("rejected");
    expect(sim.winner.reviewNote).toContain("Score numbers are obscured");

    // 5. Winner uploads Attempt #2
    sim.submitProof(winnerUser, "image/png", 1500000);
    expect(sim.winner.verificationStatus).toBe("pending_review");
    expect(sim.winner.proofAttempts).toBe(2);
    expect(sim.proofs).toHaveLength(2);

    // 6. Admin reviews Attempt #2 and approves
    sim.reviewWinner("admin-1", "approved", "Verified successfully against scorecard.");
    expect(sim.winner.verificationStatus).toBe("approved");
    expect(sim.winner.paymentStatus).toBe("pending");

    // 7. Winner attempts another upload after approval -> Rejected
    expect(() => sim.submitProof(winnerUser, "image/png", 1000)).toThrow(AppError);

    // 8. Admin marks payout as Paid
    sim.markPaid("admin-1");
    expect(sim.winner.paymentStatus).toBe("paid");
    expect(sim.winner.paidAt).not.toBeNull();

    // 9. Re-marking as paid throws PAYOUT_ALREADY_PAID
    expect(() => sim.markPaid("admin-1")).toThrow(AppError);
  });
});
