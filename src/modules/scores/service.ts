import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError, mapDbError } from "@/lib/errors";
import { SubscriptionService } from "@/modules/subscriptions/service";
import type { Database } from "@/types/database";
import type { CreateScoreInput, UpdateScoreInput } from "./schemas";

export type GolfScore = Database["public"]["Tables"]["golf_scores"]["Row"];

export class ScoreService {
  /**
   * Retrieves user's currently retained scores, ordered newest first (PRD §05 & BR-10).
   */
  static async getUserScores(userId: string): Promise<GolfScore[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("golf_scores")
      .select("*")
      .eq("user_id", userId)
      .order("played_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      throw new AppError("INTERNAL_SERVER_ERROR", error.message, 500);
    }

    return (data || []) as GolfScore[];
  }

  /**
   * Adds a new golf score.
   * Enforces:
   * 1. Active subscriber authorization (D-07, D-12)
   * 2. Stableford 1–45 range (BR-07)
   * 3. 1 score per date uniqueness (BR-11)
   * 4. 5-score rolling window auto-trim (BR-09)
   * 5. Rejection of backdated scores older than all 5 (D-10)
   */
  static async addScore(
    userId: string,
    input: CreateScoreInput,
    actorIsAdmin: boolean = false
  ): Promise<GolfScore> {
    if (!actorIsAdmin) {
      const isSubscribed = await SubscriptionService.isUserActiveSubscriber(userId);
      if (!isSubscribed) {
        throw new AppError(
          "SUBSCRIPTION_REQUIRED",
          "An active subscription is required to add or edit golf scores.",
          403
        );
      }
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("golf_scores")
      .insert({
        user_id: userId,
        score: input.score,
        played_on: input.playedOn,
      })
      .select()
      .single();

    if (error || !data) {
      throw mapDbError(error);
    }

    return data as GolfScore;
  }

  /**
   * Updates an existing score's value or date.
   */
  static async updateScore(
    userId: string,
    scoreId: string,
    input: UpdateScoreInput,
    actorIsAdmin: boolean = false
  ): Promise<GolfScore> {
    if (!actorIsAdmin) {
      const isSubscribed = await SubscriptionService.isUserActiveSubscriber(userId);
      if (!isSubscribed) {
        throw new AppError(
          "SUBSCRIPTION_REQUIRED",
          "An active subscription is required to add or edit golf scores.",
          403
        );
      }
    }

    const supabase = createClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("golf_scores")
      .select("id, user_id")
      .eq("id", scoreId)
      .single();

    if (!existing) {
      throw new AppError("NOT_FOUND", "Score record not found", 404);
    }

    if (existing.user_id !== userId && !actorIsAdmin) {
      throw new AppError("FORBIDDEN", "You do not have permission to modify this score", 403);
    }

    const { data, error } = await supabase
      .from("golf_scores")
      .update({
        score: input.score,
        played_on: input.playedOn,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scoreId)
      .select()
      .single();

    if (error || !data) {
      throw mapDbError(error);
    }

    return data as GolfScore;
  }

  /**
   * Deletes an existing score.
   */
  static async deleteScore(
    userId: string,
    scoreId: string,
    actorIsAdmin: boolean = false
  ): Promise<void> {
    if (!actorIsAdmin) {
      const isSubscribed = await SubscriptionService.isUserActiveSubscriber(userId);
      if (!isSubscribed) {
        throw new AppError(
          "SUBSCRIPTION_REQUIRED",
          "An active subscription is required to delete golf scores.",
          403
        );
      }
    }

    const supabase = createClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("golf_scores")
      .select("id, user_id")
      .eq("id", scoreId)
      .single();

    if (!existing) {
      throw new AppError("NOT_FOUND", "Score record not found", 404);
    }

    if (existing.user_id !== userId && !actorIsAdmin) {
      throw new AppError("FORBIDDEN", "You do not have permission to delete this score", 403);
    }

    const { error } = await supabase.from("golf_scores").delete().eq("id", scoreId);

    if (error) {
      throw mapDbError(error);
    }
  }

  /**
   * Admin method to update any user's score with audit logging (PRD §11 Surface 01)
   */
  static async adminUpdateUserScore(
    adminId: string,
    targetUserId: string,
    scoreId: string,
    input: UpdateScoreInput
  ): Promise<GolfScore> {
    const adminSupabase = createAdminClient();

    const { data: beforeData } = await adminSupabase
      .from("golf_scores")
      .select("*")
      .eq("id", scoreId)
      .single();

    if (!beforeData) {
      throw new AppError("NOT_FOUND", "Score not found", 404);
    }

    const updated = await this.updateScore(targetUserId, scoreId, input, true);

    await adminSupabase.from("audit_log").insert({
      actor_id: adminId,
      action: "score.admin_edit",
      entity_type: "golf_scores",
      entity_id: scoreId,
      before_data: beforeData as unknown as Record<string, unknown>,
      after_data: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }
}
