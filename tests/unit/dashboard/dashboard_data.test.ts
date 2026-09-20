import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionService } from "@/modules/subscriptions/service";
import { ScoreService } from "@/modules/scores/service";
import { CharityService } from "@/modules/charities/service";
import { DrawService } from "@/modules/draws/service";
import { WinnerService } from "@/modules/winners/service";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("User Dashboard Data & State Aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates active subscriber status and 5-score qualification correctly", async () => {
    const userId = "user-123";

    // 1. Subscription state check
    vi.spyOn(SubscriptionService, "requireSubscriptionState").mockResolvedValueOnce({
      isSubscribed: true,
      subscription: {
        id: "sub-1",
        user_id: userId,
        plan_id: "p-monthly",
        stripe_customer_id: "cus_123",
        status: "active",
        current_period_start: "2026-09-01T00:00:00Z",
        current_period_end: "2026-10-01T00:00:00Z",
        cancel_at_period_end: false,
        created_at: "2026-09-01T00:00:00Z",
        updated_at: "2026-09-01T00:00:00Z",
        stripe_subscription_id: "sub_stripe_1",
        canceled_at: null,
      },
      headline: "Active",
      subLabel: "Active subscription",
    });

    const subState = await SubscriptionService.requireSubscriptionState(userId);
    expect(subState.isSubscribed).toBe(true);
    expect(subState.headline).toBe("Active");

    // 2. Score check (5 scores)
    vi.spyOn(ScoreService, "getUserScores").mockResolvedValueOnce([
      { id: "s1", user_id: userId, score: 36, played_on: "2026-09-15", created_at: "2026-09-15T10:00:00Z", updated_at: "2026-09-15T10:00:00Z" },
      { id: "s2", user_id: userId, score: 34, played_on: "2026-09-10", created_at: "2026-09-10T10:00:00Z", updated_at: "2026-09-10T10:00:00Z" },
      { id: "s3", user_id: userId, score: 38, played_on: "2026-09-05", created_at: "2026-09-05T10:00:00Z", updated_at: "2026-09-05T10:00:00Z" },
      { id: "s4", user_id: userId, score: 32, played_on: "2026-08-28", created_at: "2026-08-28T10:00:00Z", updated_at: "2026-08-28T10:00:00Z" },
      { id: "s5", user_id: userId, score: 40, played_on: "2026-08-20", created_at: "2026-08-20T10:00:00Z", updated_at: "2026-08-20T10:00:00Z" },
    ]);

    const scores = await ScoreService.getUserScores(userId);
    expect(scores).toHaveLength(5);
    expect(scores[0].score).toBe(36);
    expect(scores.map((s) => s.score)).toEqual([36, 34, 38, 32, 40]);
  });

  it("calculates cumulative charity impact correctly from ledger payments and direct donations", async () => {
    const userId = "user-123";

    vi.spyOn(SubscriptionService, "getUserCharityImpact").mockResolvedValueOnce({
      subscriptionCharityCents: 15000, // ₹150.00
      donationCharityCents: 50000,     // ₹500.00
      totalCharityCents: 65000,        // ₹650.00
    });

    const impact = await SubscriptionService.getUserCharityImpact(userId);
    expect(impact.subscriptionCharityCents).toBe(15000);
    expect(impact.donationCharityCents).toBe(50000);
    expect(impact.totalCharityCents).toBe(65000);
  });

  it("retrieves user draw participation and match results", async () => {
    const userId = "user-123";

    vi.spyOn(DrawService, "getUserDrawParticipation").mockResolvedValueOnce({
      totalDrawsEntered: 2,
      entries: [
        {
          id: "entry-1",
          drawId: "draw-2026-08",
          drawMonth: "2026-08-01",
          scores: [36, 34, 38, 32, 40],
          matchCount: 4,
          tier: 4,
          drawnNumbers: [36, 34, 38, 32, 19],
        },
      ],
    });

    const participation = await DrawService.getUserDrawParticipation(userId);
    expect(participation.totalDrawsEntered).toBe(2);
    expect(participation.entries[0].matchCount).toBe(4);
    expect(participation.entries[0].tier).toBe(4);
  });

  it("filters unverified winning claims correctly for the dashboard action banner", async () => {
    const userId = "user-123";

    vi.spyOn(WinnerService, "getUserWinnings").mockResolvedValueOnce([
      {
        id: "w-1",
        draw_id: "draw-1",
        entry_id: "e-1",
        user_id: userId,
        tier: 4,
        prize_cents: 271852,
        verification_status: "awaiting_proof",
        proof_attempts: 0,
        reviewed_by: null,
        reviewed_at: null,
        review_note: null,
        payment_status: "pending",
        paid_at: null,
        paid_by: null,
        created_at: "2026-08-31T23:59:59Z",
        updated_at: "2026-08-31T23:59:59Z",
        draw: {
          id: "draw-1",
          draw_month: "2026-08-01",
          mode: "random",
          drawn_numbers: [36, 34, 38, 32, 19],
        },
      },
      {
        id: "w-2",
        draw_id: "draw-0",
        entry_id: "e-0",
        user_id: userId,
        tier: 3,
        prize_cents: 83220,
        verification_status: "approved",
        proof_attempts: 1,
        reviewed_by: "admin-1",
        reviewed_at: "2026-08-01T12:00:00Z",
        review_note: null,
        payment_status: "paid",
        paid_at: "2026-08-02T10:00:00Z",
        paid_by: "admin-1",
        created_at: "2026-07-31T23:59:59Z",
        updated_at: "2026-08-02T10:00:00Z",
        draw: {
          id: "draw-0",
          draw_month: "2026-07-01",
          mode: "random",
          drawn_numbers: [36, 34, 38, 12, 15],
        },
      },
    ]);

    const winnings = await WinnerService.getUserWinnings(userId);
    const unverified = winnings.filter(
      (w) => w.verification_status === "awaiting_proof" || w.verification_status === "rejected"
    );

    expect(unverified).toHaveLength(1);
    expect(unverified[0].id).toBe("w-1");
    expect(unverified[0].prize_cents).toBe(271852);
  });
});
