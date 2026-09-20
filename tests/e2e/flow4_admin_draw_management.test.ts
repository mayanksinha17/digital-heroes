import { describe, it, expect, vi, beforeEach } from "vitest";
import { runDraw, type DrawInputEntry } from "@/modules/draws/engine/runDraw";
import type { SubscriberInfo } from "@/modules/draws/engine/pools";
import { createMockSupabaseClient } from "../helpers/mockSupabase";

describe("E2E Flow 4 — Admin Draw Orchestration (Create, Snapshot, Simulate, Publish)", () => {
  const drawId = "draw-june-2026";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("orchestrates the complete draw lifecycle with participant snapshots and atomic publishing", async () => {
    // 1. Participant snapshot gathering (5 qualified subscribers)
    const subscribers: SubscriberInfo[] = [
      { userId: "u1", planCode: "monthly", monthlyEquivalentCents: 49900 },
      { userId: "u2", planCode: "monthly", monthlyEquivalentCents: 49900 },
      { userId: "u3", planCode: "monthly", monthlyEquivalentCents: 49900 },
      { userId: "u4", planCode: "monthly", monthlyEquivalentCents: 49900 },
      { userId: "u5", planCode: "monthly", monthlyEquivalentCents: 49900 },
    ];

    const entries: DrawInputEntry[] = [
      { userId: "u1", scores: [10, 15, 20, 25, 30] },
      { userId: "u2", scores: [5, 12, 18, 22, 35] },
      { userId: "u3", scores: [10, 15, 20, 28, 32] },
      { userId: "u4", scores: [1, 2, 3, 4, 5] },
      { userId: "u5", scores: [10, 15, 20, 25, 30] },
    ];

    // 2. Execute draw engine simulation with deterministic numbers
    const fixedDrawnNumbers = [10, 15, 20, 25, 30];
    const drawResult = runDraw(
      "random",
      subscribers,
      entries,
      0,
      { drawnNumbersOverride: fixedDrawnNumbers }
    );

    // Check pool conservation: 5 * 49900 * 0.5 = 124750 paise pool
    expect(drawResult.tierPools.poolNewCents).toBe(124750);
    // 40/35/25 distribution
    expect(drawResult.tierPools.pool5Cents).toBe(49900); // 40%
    expect(drawResult.tierPools.pool4Cents).toBe(43662); // 35%
    expect(drawResult.tierPools.pool3Cents).toBe(31187); // 25%

    // u1 and u5 matched 5 numbers (Tier 5 Jackpot winners!)
    const tier5Winners = drawResult.allocation.winners.filter((w) => w.tier === 5);
    expect(tier5Winners.length).toBe(2);
    expect(tier5Winners[0].prizeCents).toBe(24950); // 49900 / 2
    expect(tier5Winners[1].prizeCents).toBe(24950);

    // u3 matched 3 numbers (10, 15, 20) -> Tier 3 winner
    const tier3Winners = drawResult.allocation.winners.filter((w) => w.tier === 3);
    expect(tier3Winners.length).toBe(1);
    expect(tier3Winners[0].prizeCents).toBe(31187);

    // 3. Mock publish_draw_atomic RPC
    const mockSupabase = createMockSupabaseClient();
    mockSupabase.rpc.mockResolvedValue({
      data: {
        success: true,
        draw_id: drawId,
        status: "published",
        total_winners: 3,
        rollover_out_cents: 0,
      },
      error: null,
    });

    const publishResult = await mockSupabase.rpc("publish_draw_atomic", {
      p_draw_id: drawId,
      p_simulation_id: "sim-123",
      p_drawn_numbers: fixedDrawnNumbers,
      p_pool_total_cents: drawResult.tierPools.poolNewCents,
      p_pool_5_cents: drawResult.tierPools.pool5Cents,
      p_pool_4_cents: drawResult.tierPools.pool4Cents,
      p_pool_3_cents: drawResult.tierPools.pool3Cents,
      p_rollover_out_cents: drawResult.allocation.rolloverOutCents,
      p_allocations: drawResult.allocation.winners,
      p_entries: drawResult.matchedEntries,
    });

    expect(publishResult.data.success).toBe(true);
    expect(publishResult.data.total_winners).toBe(3);
  });
});
