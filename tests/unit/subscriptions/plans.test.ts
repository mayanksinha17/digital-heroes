import { describe, it, expect } from "vitest";
import { formatMoney, getMonthlyEquivalentCents } from "@/lib/money";

describe("Subscription Plans & Pricing (PRD §04 & D-03)", () => {
  const samplePlans = [
    {
      id: "p-monthly",
      code: "monthly",
      name: "Monthly Hero Plan",
      billing_interval: "month" as const,
      price_cents: 49900, // ₹499
      currency: "INR",
      monthly_equivalent_cents: 49900,
    },
    {
      id: "p-yearly",
      code: "yearly",
      name: "Yearly Hero Plan (Discounted)",
      billing_interval: "year" as const,
      price_cents: 499900, // ₹4,999
      currency: "INR",
      monthly_equivalent_cents: 41658,
    },
  ];

  it("provides monthly and yearly plans with correct prices", () => {
    const monthly = samplePlans.find((p) => p.code === "monthly");
    const yearly = samplePlans.find((p) => p.code === "yearly");

    expect(monthly).toBeDefined();
    expect(monthly?.price_cents).toBe(49900);

    expect(yearly).toBeDefined();
    expect(yearly?.price_cents).toBe(499900);
  });

  it("calculates discounted monthly equivalent for yearly subscribers (D-23)", () => {
    const yearly = samplePlans.find((p) => p.code === "yearly")!;
    const calculatedEquivalent = getMonthlyEquivalentCents(yearly.price_cents, "year");

    // 499,900 / 12 = 41658.33 -> 41658 paise
    expect(calculatedEquivalent).toBe(41658);
    // Yearly equivalent is ~16.5% lower than monthly plan (49,900)
    expect(calculatedEquivalent).toBeLessThan(49900);
  });

  it("formats plan prices deterministically in localized currency", () => {
    const monthly = samplePlans.find((p) => p.code === "monthly")!;
    const formatted = formatMoney(monthly.price_cents, monthly.currency);
    expect(formatted).toContain("499");
  });
});
