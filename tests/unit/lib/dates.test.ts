import { describe, it, expect } from "vitest";
import { getDrawMonthString, isFutureDate } from "@/lib/dates";

describe("lib/dates", () => {
  it("formats draw month as YYYY-MM-01", () => {
    expect(getDrawMonthString(2026, 9)).toBe("2026-09-01");
    expect(getDrawMonthString(2026, 12)).toBe("2026-12-01");
  });

  it("identifies future and past dates accurately", () => {
    expect(isFutureDate("2099-01-01")).toBe(true);
    expect(isFutureDate("2020-01-01")).toBe(false);
  });
});
