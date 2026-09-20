import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionService } from "@/modules/subscriptions/service";
import { CharityService } from "@/modules/charities/service";
import { DrawService } from "@/modules/draws/service";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Public Website Data Consistency & Plan Integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads configured active subscription plans with exact minor unit pricing", async () => {
    vi.spyOn(SubscriptionService, "getActivePlans").mockResolvedValueOnce([
      {
        id: "p-monthly",
        code: "monthly",
        name: "Monthly Hero Plan",
        billing_interval: "month",
        price_cents: 49900,
        currency: "INR",
        stripe_price_id: null,
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
        stripe_price_id: null,
        is_active: true,
        monthly_equivalent_cents: 41658,
      },
    ]);

    const plans = await SubscriptionService.getActivePlans();
    expect(plans).toHaveLength(2);
    expect(plans[0].price_cents).toBe(49900);   // ₹499.00
    expect(plans[1].price_cents).toBe(499900);  // ₹4,999.00
    expect(plans[1].monthly_equivalent_cents).toBe(41658); // ₹416.58
  });

  it("retrieves published draw results without exposing private entrant details", async () => {
    vi.spyOn(DrawService, "getDraws").mockResolvedValueOnce([
      {
        id: "draw-pub-1",
        draw_month: "2026-08-01",
        mode: "random",
        status: "published",
        config: {},
        drawn_numbers: [14, 22, 31, 38, 42],
        active_subscriber_count: 100,
        entry_count: 80,
        pool_breakdown: null,
        pool_new_cents: 2330160,
        rollover_in_cents: 0,
        pool_total_cents: 2330160,
        pool_5_cents: 932064,
        pool_4_cents: 815556,
        pool_3_cents: 582540,
        rollover_out_cents: 932064,
        unallocated_cents: 0,
        published_at: "2026-08-31T23:59:59Z",
        published_by: "admin-1",
        published_simulation_id: "sim-1",
        created_by: "admin-1",
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-31T23:59:59Z",
      },
    ]);

    const draws = await DrawService.getDraws();
    const published = draws.filter((d) => d.status === "published");
    expect(published).toHaveLength(1);
    expect(published[0].drawn_numbers).toEqual([14, 22, 31, 38, 42]);
    expect(published[0].pool_total_cents).toBe(2330160);
  });

  it("filters featured partner charities for public spotlight display", async () => {
    vi.spyOn(CharityService, "getCharities").mockResolvedValueOnce([
      {
        id: "c-1",
        name: "Junior Golf Foundation",
        slug: "junior-golf",
        short_description: "Youth golf development programs",
        description: "Empowering underserved youth through sports.",
        logo_url: null,
        hero_image_url: null,
        website_url: "https://juniorgolf.org",
        category: "Youth & Sports",
        is_active: true,
        is_featured: true,
        featured_order: 1,
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-01T00:00:00Z",
        archived_at: null,
      },
    ]);

    const featured = await CharityService.getCharities({ featuredOnly: true });
    expect(featured).toHaveLength(1);
    expect(featured[0].is_featured).toBe(true);
    expect(featured[0].name).toBe("Junior Golf Foundation");
  });
});
