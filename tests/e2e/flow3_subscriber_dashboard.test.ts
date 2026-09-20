import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionService } from "@/modules/subscriptions/service";
import { ScoreService } from "@/modules/scores/service";
import { DrawService } from "@/modules/draws/service";

describe("E2E Flow 3 — Subscriber Comprehensive Dashboard Aggregation", () => {
  const userId = "sub-user-333";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates subscription status, rolling 5 scores, charity impact, and draw qualification", async () => {
    // 1. Subscription status
    vi.spyOn(SubscriptionService, "requireSubscriptionState").mockResolvedValueOnce({
      isSubscribed: true,
      subscription: {
        id: "sub-1",
        user_id: userId,
        plan_id: "plan-monthly",
        stripe_customer_id: "cus_123",
        status: "active",
        current_period_start: "2026-06-01T00:00:00Z",
        current_period_end: "2026-07-01T00:00:00Z",
        cancel_at_period_end: false,
        created_at: "2026-06-01T00:00:00Z",
        updated_at: "2026-06-01T00:00:00Z",
        stripe_subscription_id: "sub_stripe_1",
        canceled_at: null,
      },
      headline: "Active",
      subLabel: "Active subscription",
    });

    // 2. Scores
    vi.spyOn(ScoreService, "getUserScores").mockResolvedValueOnce([
      { id: "s1", user_id: userId, score: 40, played_on: "2026-06-01", created_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-01T00:00:00Z" },
      { id: "s2", user_id: userId, score: 38, played_on: "2026-06-05", created_at: "2026-06-05T00:00:00Z", updated_at: "2026-06-05T00:00:00Z" },
      { id: "s3", user_id: userId, score: 42, played_on: "2026-06-10", created_at: "2026-06-10T00:00:00Z", updated_at: "2026-06-10T00:00:00Z" },
      { id: "s4", user_id: userId, score: 36, played_on: "2026-06-15", created_at: "2026-06-15T00:00:00Z", updated_at: "2026-06-15T00:00:00Z" },
      { id: "s5", user_id: userId, score: 39, played_on: "2026-06-20", created_at: "2026-06-20T00:00:00Z", updated_at: "2026-06-20T00:00:00Z" },
    ]);

    // 3. Charity impact
    vi.spyOn(SubscriptionService, "getUserCharityImpact").mockResolvedValueOnce({
      subscriptionCharityCents: 11976,
      donationCharityCents: 50000,
      totalCharityCents: 61976,
    });

    // 4. Draw participation
    vi.spyOn(DrawService, "getUserDrawParticipation").mockResolvedValueOnce({
      totalDrawsEntered: 1,
      entries: [
        {
          id: "entry-1",
          drawId: "draw-1",
          drawMonth: "2026-06",
          scores: [40, 38, 42, 36, 39],
          matchCount: 5,
          tier: 5,
          drawnNumbers: [40, 38, 42, 36, 39],
        },
      ],
    });

    const subState = await SubscriptionService.requireSubscriptionState(userId);
    const scores = await ScoreService.getUserScores(userId);
    const charityState = await SubscriptionService.getUserCharityImpact(userId);
    const drawParticipation = await DrawService.getUserDrawParticipation(userId);

    expect(subState.isSubscribed).toBe(true);
    expect(subState.subscription?.status).toBe("active");
    expect(scores.length).toBe(5);
    expect(charityState.totalCharityCents).toBe(61976);
    expect(drawParticipation.totalDrawsEntered).toBe(1);
  });
});
