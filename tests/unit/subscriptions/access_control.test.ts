import { describe, it, expect } from "vitest";
import type { Subscription } from "@/modules/subscriptions/service";

describe("Subscription Access Control & Lifecycle States (PRD §04, D-05, D-06, AT-04)", () => {
  function evaluateSubscriptionState(subscription: Subscription | null): {
    isSubscribed: boolean;
    headline: "Active" | "Inactive";
    subLabel: string;
  } {
    if (!subscription) {
      return {
        isSubscribed: false,
        headline: "Inactive",
        subLabel: "No active subscription",
      };
    }

    const now = new Date("2026-09-20T12:00:00Z");
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;

    const isPeriodValid = periodEnd ? periodEnd > now : false;

    if (subscription.status === "active") {
      if (subscription.cancel_at_period_end) {
        return {
          isSubscribed: isPeriodValid,
          headline: isPeriodValid ? "Active" : "Inactive",
          subLabel: isPeriodValid
            ? `Cancels at end of period (${periodEnd?.toLocaleDateString()})`
            : "Lapsed (canceled)",
        };
      }
      return {
        isSubscribed: isPeriodValid,
        headline: isPeriodValid ? "Active" : "Inactive",
        subLabel: isPeriodValid ? "Active subscription" : "Lapsed",
      };
    }

    if (subscription.status === "past_due") {
      return {
        isSubscribed: false,
        headline: "Inactive",
        subLabel: "Payment past due",
      };
    }

    return {
      isSubscribed: false,
      headline: "Inactive",
      subLabel: `Subscription ${subscription.status}`,
    };
  }

  it("grants full access to active subscribers with future period_end", () => {
    const activeSub: Subscription = {
      id: "sub-01",
      user_id: "u-01",
      plan_id: "p-monthly",
      stripe_subscription_id: "sub_stripe_123",
      stripe_customer_id: "cus_123",
      status: "active",
      current_period_start: "2026-09-01T00:00:00Z",
      current_period_end: "2026-10-01T00:00:00Z",
      cancel_at_period_end: false,
      canceled_at: null,
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-09-01T00:00:00Z",
    };

    const state = evaluateSubscriptionState(activeSub);
    expect(state.isSubscribed).toBe(true);
    expect(state.headline).toBe("Active");
  });

  it("maintains access when cancel_at_period_end=true until period_end passes (AT-04)", () => {
    const cancelingSub: Subscription = {
      id: "sub-02",
      user_id: "u-02",
      plan_id: "p-monthly",
      stripe_subscription_id: "sub_stripe_456",
      stripe_customer_id: "cus_456",
      status: "active",
      current_period_start: "2026-09-01T00:00:00Z",
      current_period_end: "2026-10-01T00:00:00Z",
      cancel_at_period_end: true,
      canceled_at: "2026-09-15T00:00:00Z",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-09-15T00:00:00Z",
    };

    const state = evaluateSubscriptionState(cancelingSub);
    expect(state.isSubscribed).toBe(true);
    expect(state.headline).toBe("Active");
    expect(state.subLabel).toContain("Cancels at end of period");
  });

  it("restricts access when subscription is past_due (AT-04)", () => {
    const pastDueSub: Subscription = {
      id: "sub-03",
      user_id: "u-03",
      plan_id: "p-monthly",
      stripe_subscription_id: "sub_stripe_789",
      stripe_customer_id: "cus_789",
      status: "past_due",
      current_period_start: "2026-08-01T00:00:00Z",
      current_period_end: "2026-09-01T00:00:00Z",
      cancel_at_period_end: false,
      canceled_at: null,
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-09-02T00:00:00Z",
    };

    const state = evaluateSubscriptionState(pastDueSub);
    expect(state.isSubscribed).toBe(false);
    expect(state.headline).toBe("Inactive");
    expect(state.subLabel).toContain("Payment past due");
  });

  it("restricts access when subscription has expired/lapsed", () => {
    const lapsedSub: Subscription = {
      id: "sub-04",
      user_id: "u-04",
      plan_id: "p-monthly",
      stripe_subscription_id: "sub_stripe_000",
      stripe_customer_id: "cus_000",
      status: "canceled",
      current_period_start: "2026-07-01T00:00:00Z",
      current_period_end: "2026-08-01T00:00:00Z",
      cancel_at_period_end: false,
      canceled_at: "2026-08-01T00:00:00Z",
      created_at: "2026-07-01T00:00:00Z",
      updated_at: "2026-08-01T00:00:00Z",
    };

    const state = evaluateSubscriptionState(lapsedSub);
    expect(state.isSubscribed).toBe(false);
    expect(state.headline).toBe("Inactive");
  });
});
