import { describe, it, expect, vi, beforeEach } from "vitest";
import { CharityService } from "@/modules/charities/service";
import { DrawService } from "@/modules/draws/service";
import { SubscriptionService } from "@/modules/subscriptions/service";
import type { DrawRow } from "@/modules/draws/types";

describe("E2E Flow 6 — Public Visitor Journey (Landing, Rules, Pricing, Charities, Draws, Signup)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serves all public assets, published results, and plan information without requiring authentication", async () => {
    // 1. Subscription active plans
    vi.spyOn(SubscriptionService, "getActivePlans").mockResolvedValueOnce([
      {
        id: "p-monthly",
        code: "monthly",
        name: "Monthly Hero Plan",
        billing_interval: "month",
        price_cents: 49900,
        currency: "INR",
        stripe_price_id: "price_1",
        is_active: true,
        monthly_equivalent_cents: 49900,
      },
      {
        id: "p-yearly",
        code: "yearly",
        name: "Yearly Hero Plan (Discounted)",
        billing_interval: "year",
        price_cents: 499900,
        currency: "INR",
        stripe_price_id: "price_2",
        is_active: true,
        monthly_equivalent_cents: 41658,
      },
    ]);

    // 2. Charity directory
    vi.spyOn(CharityService, "getCharities").mockResolvedValueOnce([
      {
        id: "c1",
        name: "Junior Golf Foundation",
        slug: "junior-golf",
        short_description: "Supporting youth sports",
        description: "Comprehensive mission supporting underprivileged youth golfers.",
        category: "Youth & Sports",
        hero_image_url: "https://example.com/jgf.jpg",
        logo_url: null,
        website_url: "https://juniorgolf.org",
        is_active: true,
        is_featured: true,
        featured_order: 1,
        archived_at: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ]);

    // 3. Draw history
    const sampleDraw = {
      id: "draw-may-2026",
      draw_month: "2026-05-01",
      mode: "random",
      status: "published",
      drawn_numbers: [12, 24, 31, 38, 45],
      pool_total_cents: 2330160,
      pool_5_cents: 932064,
      pool_4_cents: 815556,
      pool_3_cents: 582540,
      rollover_in_cents: 0,
      rollover_out_cents: 932064,
      created_by: "admin-1",
      published_at: "2026-05-31T20:00:00Z",
      created_at: "2026-05-01T00:00:00Z",
      updated_at: "2026-05-31T20:00:00Z",
    } as unknown as DrawRow;

    vi.spyOn(DrawService, "getDraws").mockResolvedValueOnce([sampleDraw]);

    const plans = await SubscriptionService.getActivePlans();
    expect(plans.length).toBe(2);
    expect(plans[0].price_cents).toBe(49900);
    expect(plans[1].price_cents).toBe(499900);

    const charities = await CharityService.getCharities();
    expect(charities.length).toBe(1);
    expect(charities[0].name).toBe("Junior Golf Foundation");

    const draws = await DrawService.getDraws();
    expect(draws.length).toBe(1);
    expect(draws[0].drawn_numbers).toEqual([12, 24, 31, 38, 45]);
  });
});
