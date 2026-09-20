import { describe, it, expect } from "vitest";
import { DEFAULT_PLATFORM_SETTINGS } from "@/modules/settings/service";

describe("Platform Settings & Defaults (DATABASE.md & D-settings registry)", () => {
  it("includes all required platform configuration keys with PRD-compliant defaults", () => {
    expect(DEFAULT_PLATFORM_SETTINGS.currency).toBe("inr");
    expect(DEFAULT_PLATFORM_SETTINGS.prize_pool_percent).toBe(50);
    expect(DEFAULT_PLATFORM_SETTINGS.tier_shares).toEqual({ "5": 40, "4": 35, "3": 25 });
    expect(DEFAULT_PLATFORM_SETTINGS.score_retained_count).toBe(5);
    expect(DEFAULT_PLATFORM_SETTINGS.min_scores_to_enter).toBe(5);
    expect(DEFAULT_PLATFORM_SETTINGS.charity_min_percent).toBe(10);
    expect(DEFAULT_PLATFORM_SETTINGS.proof_max_attempts).toBe(3);
    expect(DEFAULT_PLATFORM_SETTINGS.proof_max_size_mb).toBe(5);
  });

  it("ensures tier shares sum exactly to 100%", () => {
    const sum =
      DEFAULT_PLATFORM_SETTINGS.tier_shares["5"] +
      DEFAULT_PLATFORM_SETTINGS.tier_shares["4"] +
      DEFAULT_PLATFORM_SETTINGS.tier_shares["3"];
    expect(sum).toBe(100);
  });
});
