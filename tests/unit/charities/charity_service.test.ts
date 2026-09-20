import { describe, it, expect } from "vitest";
import { calculateCharityContribution } from "@/lib/money";
import {
  createCharitySchema,
  updateCharitySelectionSchema,
} from "@/modules/charities/schemas";
import type { Charity } from "@/modules/charities/service";

describe("Charity Service & Invariants (PRD §08)", () => {
  const sampleCharities: Charity[] = [
    {
      id: "c-01",
      slug: "junior-golf-foundation",
      name: "Junior Golf Foundation",
      short_description: "Youth sports mentorship and scholarships.",
      description: "Empowering children through golf and education.",
      category: "Youth & Sports",
      logo_url: null,
      hero_image_url: null,
      website_url: "https://juniorgolf.example",
      is_featured: true,
      featured_order: 1,
      is_active: true,
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "c-02",
      slug: "green-fairways",
      name: "Green Fairways Conservation",
      short_description: "Preserving wetlands and biodiversity.",
      description: "Conservation programs on recreational lands.",
      category: "Environment",
      logo_url: null,
      hero_image_url: null,
      website_url: null,
      is_featured: true,
      featured_order: 2,
      is_active: true,
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "c-03",
      slug: "veterans-care",
      name: "Veterans Care Network",
      short_description: "Physical therapy and trauma support.",
      description: "Supporting veterans and their families.",
      category: "Health & Veterans",
      logo_url: null,
      hero_image_url: null,
      website_url: null,
      is_featured: false,
      featured_order: null,
      is_active: false,
      archived_at: "2026-01-01T00:00:00Z",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  describe("Public Charity Listing & Filtering", () => {
    function filterCharities(
      charities: Charity[],
      search?: string,
      category?: string
    ): Charity[] {
      return charities.filter((c) => {
        if (!c.is_active || c.archived_at) return false;
        if (category && category !== "All" && c.category !== category) return false;
        if (search) {
          const s = search.toLowerCase();
          return c.name.toLowerCase().includes(s) || c.short_description.toLowerCase().includes(s);
        }
        return true;
      });
    }

    it("filters out inactive and archived charities for public directory", () => {
      const active = filterCharities(sampleCharities);
      expect(active).toHaveLength(2);
      expect(active.some((c) => c.id === "c-03")).toBe(false);
    });

    it("searches charities by keyword in name or short description", () => {
      const results = filterCharities(sampleCharities, "wetlands");
      expect(results).toHaveLength(1);
      expect(results[0].slug).toBe("green-fairways");
    });

    it("filters charities by category", () => {
      const results = filterCharities(sampleCharities, undefined, "Youth & Sports");
      expect(results).toHaveLength(1);
      expect(results[0].slug).toBe("junior-golf-foundation");
    });
  });

  describe("Featured Spotlight Selection", () => {
    it("orders featured charities by featured_order", () => {
      const featured = sampleCharities
        .filter((c) => c.is_active && c.is_featured)
        .sort((a, b) => (a.featured_order || 99) - (b.featured_order || 99));

      expect(featured[0].slug).toBe("junior-golf-foundation");
      expect(featured[1].slug).toBe("green-fairways");
    });
  });

  describe("Subscriber Charity Selection & Contribution Bounds (PRD §08.1 & AT-03)", () => {
    it("validates minimum 10% charity contribution", () => {
      const valid = updateCharitySelectionSchema.safeParse({
        charityId: "11111111-1111-1111-1111-111111111111",
        charityPercent: 10,
      });
      expect(valid.success).toBe(true);
    });

    it("accepts voluntary increase in contribution percentage (e.g. 25%, 50%)", () => {
      const valid = updateCharitySelectionSchema.safeParse({
        charityId: "11111111-1111-1111-1111-111111111111",
        charityPercent: 25,
      });
      expect(valid.success).toBe(true);
    });

    it("strictly rejects charity contribution below 10%", () => {
      const invalid = updateCharitySelectionSchema.safeParse({
        charityId: "11111111-1111-1111-1111-111111111111",
        charityPercent: 8,
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.errors[0].message).toContain("Minimum charity contribution is 10%");
      }
    });

    it("calculates exact charity portion from invoice payments in minor units (AT-03)", () => {
      // Monthly fee ₹499 (49,900 paise) @ 10% -> 4,990 paise
      expect(calculateCharityContribution(49900, 10)).toBe(4990);

      // Monthly fee ₹499 (49,900 paise) @ 15% -> 7,485 paise
      expect(calculateCharityContribution(49900, 15)).toBe(7485);

      // Yearly fee ₹4,999 (499,900 paise) @ 10% -> 49,990 paise
      expect(calculateCharityContribution(499900, 10)).toBe(49990);
    });
  });

  describe("Admin Charity Validation", () => {
    it("validates correct charity creation input", () => {
      const valid = createCharitySchema.safeParse({
        slug: "clean-water-project",
        name: "Clean Water Project",
        shortDescription: "Providing clean drinking water to remote villages.",
        description: "Installing solar-powered filtration units across drought-prone regions.",
        category: "Community Development",
        isFeatured: true,
        featuredOrder: 3,
        isActive: true,
      });
      expect(valid.success).toBe(true);
    });

    it("rejects invalid slug format with spaces or uppercase", () => {
      const invalid = createCharitySchema.safeParse({
        slug: "Clean Water Project",
        name: "Clean Water Project",
        shortDescription: "Providing clean drinking water to remote villages.",
        description: "Installing solar-powered filtration units across drought-prone regions.",
        category: "Community Development",
      });
      expect(invalid.success).toBe(false);
    });
  });
});
