import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError, mapDbError } from "@/lib/errors";
import { runDraw, type DrawResult, type DrawInputEntry } from "./engine";
import type { SubscriberInfo } from "./engine/pools";
import type {
  DrawRow,
  DrawSimulationRow,
  DrawEntryRow,
  DrawWinnerRow,
  DrawMode,
  DrawPublishSummary,
} from "./types";
import type { CreateDrawInput, SimulateDrawInput, PublishDrawInput } from "./schemas";

export class DrawService {
  /**
   * Retrieves all draws (admin listing)
   */
  static async getDraws(): Promise<DrawRow[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .order("draw_month", { ascending: false });

    if (error) throw mapDbError(error);
    return (data || []) as DrawRow[];
  }

  /**
   * Retrieves a draw by ID
   */
  static async getDrawById(drawId: string): Promise<DrawRow | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .eq("id", drawId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw mapDbError(error);
    }
    return data as DrawRow;
  }

  /**
   * Retrieves a draw by its calendar month (YYYY-MM-01)
   */
  static async getDrawByMonth(drawMonth: string): Promise<DrawRow | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .eq("draw_month", drawMonth)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw mapDbError(error);
    }
    return data as DrawRow;
  }

  /**
   * Creates a new monthly draw in DRAFT status (Admin only, PRD §06 & D-18)
   */
  static async createMonthlyDraw(
    adminId: string,
    input: CreateDrawInput
  ): Promise<DrawRow> {
    const supabase = createClient();
    const adminSupabase = createAdminClient();

    // 1. Check if draw for this month already exists
    const existing = await this.getDrawByMonth(input.drawMonth);
    if (existing) {
      throw new AppError(
        "DRAW_ALREADY_PUBLISHED",
        `A draw for ${input.drawMonth} already exists.`,
        409
      );
    }

    // 2. Validate draw month is not in the future past current month (D-18)
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    if (input.drawMonth > currentMonthStr) {
      throw new AppError(
        "DRAW_FUTURE_MONTH",
        "Cannot create a draw for a future calendar month.",
        400
      );
    }

    // 3. Determine incoming jackpot rollover from the latest published draw
    const { data: lastPublished } = await supabase
      .from("draws")
      .select("rollover_out_cents, draw_month")
      .eq("status", "published")
      .order("draw_month", { ascending: false })
      .limit(1)
      .single();

    const rolloverInCents = Number(lastPublished?.rollover_out_cents || 0);

    // 4. Create new draft draw
    const { data, error } = await adminSupabase
      .from("draws")
      .insert({
        draw_month: input.drawMonth,
        mode: input.mode,
        status: "draft",
        rollover_in_cents: rolloverInCents,
        created_by: adminId,
      })
      .select()
      .single();

    if (error || !data) {
      throw mapDbError(error);
    }

    // 5. Audit log
    await adminSupabase.from("audit_log").insert({
      actor_id: adminId,
      action: "draw.create",
      entity_type: "draws",
      entity_id: data.id,
      after_data: {
        draw_month: input.drawMonth,
        mode: input.mode,
        rollover_in_cents: rolloverInCents,
      },
    });

    return data as DrawRow;
  }

  /**
   * Captures server-side snapshot of active subscribers and eligible entrants (5 scores).
   */
  static async getEligibleParticipantsSnapshot(): Promise<{
    subscribers: SubscriberInfo[];
    entries: DrawInputEntry[];
  }> {
    const adminSupabase = createAdminClient();

    // 1. Query active subscriptions
    const { data: activeSubs, error: subError } = await adminSupabase
      .from("subscriptions")
      .select("user_id, plan_id, status, current_period_end, plans(code, price_cents, interval)")
      .eq("status", "active")
      .gt("current_period_end", new Date().toISOString());

    if (subError) throw mapDbError(subError);

    const subscribers: SubscriberInfo[] = (activeSubs || []).map((s) => {
      const plan = s.plans as { code?: string; price_cents?: number; interval?: string } | null;
      const priceCents = plan?.price_cents || 49900;
      const interval = plan?.interval || "month";
      const monthlyEquivalentCents = interval === "year" ? Math.floor(priceCents / 12) : priceCents;

      return {
        userId: s.user_id,
        planCode: (plan?.code || "monthly") as "monthly" | "yearly",
        monthlyEquivalentCents,
      };
    });

    // 2. Query latest scores for active subscribers
    const entries: DrawInputEntry[] = [];

    for (const sub of subscribers) {
      const { data: scores } = await adminSupabase
        .from("golf_scores")
        .select("score, played_on, created_at")
        .eq("user_id", sub.userId)
        .order("played_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);

      // Entrant qualification: must have >= 5 scores (D-13)
      if (scores && scores.length >= 5) {
        entries.push({
          userId: sub.userId,
          scores: scores.map((s) => s.score),
        });
      }
    }

    return { subscribers, entries };
  }

  /**
   * Executes a draw simulation without publishing (Admin only, PRD §06 & D-20)
   */
  static async simulateDraw(
    adminId: string,
    input: SimulateDrawInput
  ): Promise<{
    simulation: DrawSimulationRow;
    result: DrawResult;
  }> {
    const adminSupabase = createAdminClient();

    // 1. Fetch draw
    const draw = await this.getDrawById(input.drawId);
    if (!draw) {
      throw new AppError("DRAW_NOT_FOUND", "Draw record not found", 404);
    }

    if (draw.status === "published") {
      throw new AppError(
        "DRAW_ALREADY_PUBLISHED",
        "Cannot run simulation on an already published draw.",
        400
      );
    }

    const mode: DrawMode = input.mode || draw.mode;

    // 2. Snapshot current participants
    const { subscribers, entries } = await this.getEligibleParticipantsSnapshot();

    // 3. Run pure Draw Engine
    const result = runDraw(
      mode,
      subscribers,
      entries,
      draw.rollover_in_cents,
      (draw.config as Record<string, unknown>) || {}
    );

    // 4. Record simulation in draw_simulations
    const { data: simRow, error: simError } = await adminSupabase
      .from("draw_simulations")
      .insert({
        draw_id: input.drawId,
        mode,
        config: (draw.config as Record<string, unknown>) || {},
        drawn_numbers: result.drawnNumbers,
        result: result as unknown as Record<string, unknown>,
        created_by: adminId,
      })
      .select()
      .single();

    if (simError || !simRow) {
      throw mapDbError(simError);
    }

    // 5. Update draw status to 'simulated'
    await adminSupabase
      .from("draws")
      .update({
        status: "simulated",
        mode,
        drawn_numbers: result.drawnNumbers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.drawId);

    // 6. Audit log
    await adminSupabase.from("audit_log").insert({
      actor_id: adminId,
      action: "draw.simulate",
      entity_type: "draw_simulations",
      entity_id: simRow.id,
      after_data: {
        draw_id: input.drawId,
        drawn_numbers: result.drawnNumbers,
        subscriber_count: result.subscriberCount,
        entry_count: result.entryCount,
        winners_count: result.winners.length,
      },
    });

    return {
      simulation: simRow as DrawSimulationRow,
      result,
    };
  }

  /**
   * Atomically publishes a simulated draw (Admin only, PRD §06 & D-20)
   */
  static async publishDraw(
    adminId: string,
    input: PublishDrawInput
  ): Promise<DrawPublishSummary> {
    const adminSupabase = createAdminClient();

    // 1. Fetch draw and simulation
    const draw = await this.getDrawById(input.drawId);
    if (!draw) {
      throw new AppError("DRAW_NOT_FOUND", "Draw record not found", 404);
    }

    if (draw.status === "published") {
      throw new AppError(
        "DRAW_ALREADY_PUBLISHED",
        "This draw is already published and immutable.",
        400
      );
    }

    const { data: simulation, error: simErr } = await adminSupabase
      .from("draw_simulations")
      .select("*")
      .eq("id", input.simulationId)
      .eq("draw_id", input.drawId)
      .single();

    if (simErr || !simulation) {
      throw new AppError(
        "DRAW_NOT_SIMULATED",
        "A valid simulation record for this draw is required to publish.",
        400
      );
    }

    // 2. Re-snapshot participants and recompute authoritative final results using simulation numbers
    const { subscribers, entries } = await this.getEligibleParticipantsSnapshot();
    const finalResult = runDraw(
      simulation.mode,
      subscribers,
      entries,
      draw.rollover_in_cents,
      {
        ...((draw.config as Record<string, unknown>) || {}),
        drawnNumbersOverride: simulation.drawn_numbers,
      }
    );

    // 3. Prepare payload for atomic publish
    const entriesPayload = finalResult.matchedEntries.map((e) => ({
      userId: e.userId,
      scores: e.scores,
      matchCount: e.matchCount,
      tier: e.tier,
    }));

    const winnersPayload = finalResult.winners.map((w) => ({
      userId: w.userId,
      tier: w.tier,
      prizeCents: w.prizeCents,
      matchCount: w.matchCount,
    }));

    // 4. Call publish_draw_atomic RPC
    const { error: rpcError } = await adminSupabase.rpc("publish_draw_atomic", {
      p_draw_id: input.drawId,
      p_admin_id: adminId,
      p_simulation_id: input.simulationId,
      p_drawn_numbers: simulation.drawn_numbers,
      p_active_subscriber_count: finalResult.subscriberCount,
      p_entry_count: finalResult.entryCount,
      p_pool_new_cents: finalResult.tierPools.poolNewCents,
      p_pool_total_cents: finalResult.tierPools.poolTotalCents,
      p_pool_5_cents: finalResult.tierPools.pool5Cents,
      p_pool_4_cents: finalResult.tierPools.pool4Cents,
      p_pool_3_cents: finalResult.tierPools.pool3Cents,
      p_rollover_out_cents: finalResult.allocation.rolloverOutCents,
      p_unallocated_cents: finalResult.allocation.unallocatedCents,
      p_pool_breakdown: finalResult.tierPools as unknown as Record<string, unknown>,
      p_entries: entriesPayload as unknown as Record<string, unknown>,
      p_winners: winnersPayload as unknown as Record<string, unknown>,
    });

    if (rpcError) {
      throw mapDbError(rpcError);
    }

    const winnerCounts = {
      tier5: finalResult.winners.filter((w) => w.tier === 5).length,
      tier4: finalResult.winners.filter((w) => w.tier === 4).length,
      tier3: finalResult.winners.filter((w) => w.tier === 3).length,
    };

    return {
      drawId: input.drawId,
      drawMonth: draw.draw_month,
      mode: simulation.mode,
      drawnNumbers: simulation.drawn_numbers,
      poolTotalCents: finalResult.tierPools.poolTotalCents,
      pool5Cents: finalResult.tierPools.pool5Cents,
      pool4Cents: finalResult.tierPools.pool4Cents,
      pool3Cents: finalResult.tierPools.pool3Cents,
      rolloverOutCents: finalResult.allocation.rolloverOutCents,
      winnerCounts,
    };
  }

  /**
   * Retrieves simulation history for a draw (Admin only)
   */
  static async getDrawSimulations(drawId: string): Promise<DrawSimulationRow[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("draw_simulations")
      .select("*")
      .eq("draw_id", drawId)
      .order("created_at", { ascending: false });

    if (error) throw mapDbError(error);
    return (data || []) as DrawSimulationRow[];
  }

  /**
   * Retrieves latest published draw for public/participant view
   */
  static async getLatestPublishedDraw(): Promise<DrawRow | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .eq("status", "published")
      .order("draw_month", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw mapDbError(error);
    }
    return data as DrawRow;
  }

  /**
   * Retrieves user's historical draw entries and latest match statistics
   */
  static async getUserDrawParticipation(userId: string): Promise<{
    totalDrawsEntered: number;
    entries: Array<{
      id: string;
      drawId: string;
      drawMonth: string;
      scores: number[];
      matchCount: number;
      tier: number | null;
      drawnNumbers?: number[];
    }>;
  }> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("draw_entries")
      .select("id, draw_id, scores, match_count, tier, draws(id, draw_month, drawn_numbers)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw mapDbError(error);

    const entries = (data || []).map((row) => {
      const draw = row.draws as { id?: string; draw_month?: string; drawn_numbers?: number[] } | null;
      return {
        id: row.id,
        drawId: row.draw_id,
        drawMonth: draw?.draw_month || "",
        scores: row.scores || [],
        matchCount: row.match_count,
        tier: row.tier,
        drawnNumbers: draw?.drawn_numbers,
      };
    });

    return {
      totalDrawsEntered: entries.length,
      entries,
    };
  }
}
