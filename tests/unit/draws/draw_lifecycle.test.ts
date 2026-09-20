import { describe, it, expect, vi, beforeEach } from "vitest";
import { DrawService } from "@/modules/draws/service";
import { AppError } from "@/lib/errors";
import type { DrawRow, DrawSimulationRow } from "@/modules/draws/types";

// Mock Supabase server and admin clients
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

describe("Draw Operations: Lifecycle & State Transitions (PRD §06 & D-18, D-20)", () => {
  const adminId = "admin-1111-1111";
  const drawId = "draw-aaaa-bbbb";
  const simulationId = "sim-cccc-dddd";
  const drawMonth = "2026-03-01";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Draw Creation", () => {
    it("creates a draft draw with incoming rollover from last published draw", async () => {
      const lastPublished: Partial<DrawRow> = {
        id: "last-draw",
        draw_month: "2026-02-01",
        status: "published",
        rollover_out_cents: 932064,
      };

      const createdDraft: Partial<DrawRow> = {
        id: drawId,
        draw_month: drawMonth,
        mode: "random",
        status: "draft",
        rollover_in_cents: 932064,
        created_by: adminId,
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "audit_log") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              if (col === "draw_month") {
                return { single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }) };
              }
              if (col === "status" && val === "published") {
                return {
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: lastPublished, error: null }),
                    }),
                  }),
                };
              }
              return { single: vi.fn().mockResolvedValue({ data: null, error: null }) };
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: createdDraft, error: null }),
            }),
          }),
        };
      });

      const res = await DrawService.createMonthlyDraw(adminId, {
        drawMonth,
        mode: "random",
      });

      expect(res.draw_month).toBe(drawMonth);
      expect(res.status).toBe("draft");
      expect(res.rollover_in_cents).toBe(932064);
    });

    it("prevents creating duplicate draw for the same month", async () => {
      const existingDraw: Partial<DrawRow> = {
        id: "existing-draw",
        draw_month: drawMonth,
        status: "draft",
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existingDraw, error: null }),
          }),
        }),
      });

      await expect(
        DrawService.createMonthlyDraw(adminId, { drawMonth, mode: "random" })
      ).rejects.toMatchObject({
        code: "DRAW_ALREADY_PUBLISHED",
        httpStatus: 409,
      });
    });
  });

  describe("Draw Simulation (D-20)", () => {
    it("executes simulation and updates status to simulated without publishing", async () => {
      const draftDraw: Partial<DrawRow> = {
        id: drawId,
        draw_month: drawMonth,
        mode: "random",
        status: "draft",
        rollover_in_cents: 50000,
        config: {
          drawnNumbersOverride: [5, 12, 23, 34, 41],
        },
      };

      const simRow: Partial<DrawSimulationRow> = {
        id: simulationId,
        draw_id: drawId,
        mode: "random",
        drawn_numbers: [5, 12, 23, 34, 41],
        result: {} as any,
      };

      vi.spyOn(DrawService, "getEligibleParticipantsSnapshot").mockResolvedValue({
        subscribers: [{ userId: "u1", planCode: "monthly", monthlyEquivalentCents: 49900 }],
        entries: [{ userId: "u1", scores: [5, 12, 23, 34, 41] }],
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "audit_log") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: draftDraw, error: null }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: simRow, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      const { simulation, result } = await DrawService.simulateDraw(adminId, {
        drawId,
      });

      expect(simulation.drawn_numbers).toHaveLength(5);
      expect(result.subscriberCount).toBe(1);
      expect(result.winners.length).toBe(1);
      expect(result.winners[0].tier).toBe(5);
    });

    it("rejects simulation on already published draw", async () => {
      const publishedDraw: Partial<DrawRow> = {
        id: drawId,
        status: "published",
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: publishedDraw, error: null }),
          }),
        }),
      });

      await expect(
        DrawService.simulateDraw(adminId, { drawId })
      ).rejects.toMatchObject({
        code: "DRAW_ALREADY_PUBLISHED",
        httpStatus: 400,
      });
    });
  });

  describe("Draw Publishing & Immutability (D-20)", () => {
    it("rejects publishing when no simulation exists", async () => {
      const simulatedDraw: Partial<DrawRow> = {
        id: drawId,
        status: "simulated",
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((col: string) => {
            if (col === "id") {
              // Simulation lookup fails
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
                }),
                single: vi.fn().mockResolvedValue({ data: simulatedDraw, error: null }),
              };
            }
            return { single: vi.fn().mockResolvedValue({ data: null, error: null }) };
          }),
        }),
      });

      await expect(
        DrawService.publishDraw(adminId, { drawId, simulationId })
      ).rejects.toMatchObject({
        code: "DRAW_NOT_SIMULATED",
        httpStatus: 400,
      });
    });

    it("publishes atomically using publish_draw_atomic RPC", async () => {
      const simulatedDraw: Partial<DrawRow> = {
        id: drawId,
        draw_month: drawMonth,
        status: "simulated",
        mode: "random",
        rollover_in_cents: 0,
        config: {},
      };

      const simulationRow: Partial<DrawSimulationRow> = {
        id: simulationId,
        draw_id: drawId,
        mode: "random",
        drawn_numbers: [10, 20, 30, 40, 45],
      };

      vi.spyOn(DrawService, "getEligibleParticipantsSnapshot").mockResolvedValue({
        subscribers: [{ userId: "u1", planCode: "monthly", monthlyEquivalentCents: 49900 }],
        entries: [{ userId: "u1", scores: [10, 20, 30, 40, 45] }],
      });

      mockRpc.mockResolvedValue({ error: null });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((col: string) => {
            if (col === "id") {
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: simulationRow, error: null }),
                }),
                single: vi.fn().mockResolvedValue({ data: simulatedDraw, error: null }),
              };
            }
            return { single: vi.fn().mockResolvedValue({ data: null, error: null }) };
          }),
        }),
      });

      const summary = await DrawService.publishDraw(adminId, { drawId, simulationId });

      expect(summary.drawId).toBe(drawId);
      expect(summary.drawMonth).toBe(drawMonth);
      expect(summary.winnerCounts.tier5).toBe(1);
      expect(mockRpc).toHaveBeenCalledWith(
        "publish_draw_atomic",
        expect.objectContaining({
          p_draw_id: drawId,
          p_admin_id: adminId,
          p_simulation_id: simulationId,
          p_drawn_numbers: [10, 20, 30, 40, 45],
        })
      );
    });
  });
});
