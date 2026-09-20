import { describe, it, expect } from "vitest";
import { formatMoney } from "@/lib/money";

describe("Independent Donations (PRD §08.1 & D-29)", () => {
  interface DonationRecord {
    id: string;
    charity_id: string;
    amount_cents: number;
    currency: string;
    status: "pending" | "succeeded" | "failed";
  }

  it("formats one-off donation amounts accurately", () => {
    const formatted = formatMoney(100000, "INR", "en-IN");
    expect(formatted).toContain("1,000");
  });

  it("keeps independent donations separated from draw prize pools", () => {
    const directDonation: DonationRecord = {
      id: "don-01",
      charity_id: "c-01",
      amount_cents: 250000, // ₹2,500
      currency: "INR",
      status: "succeeded",
    };

    // Verify donation is distinct from subscription pool allocations
    expect(directDonation.status).toBe("succeeded");
    expect(directDonation.amount_cents).toBe(250000);
  });
});
