"use server";

import { requireUser, requireAdmin } from "@/modules/auth/guards";
import { ScoreService, type GolfScore } from "./service";
import {
  createScoreSchema,
  updateScoreSchema,
  deleteScoreSchema,
} from "./schemas";
import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";

export interface ScoreActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Server Action: Add a new golf score for the authenticated user.
 */
export async function addScoreAction(
  score: number,
  playedOn: string
): Promise<ScoreActionResult<GolfScore>> {
  const parsed = createScoreSchema.safeParse({ score, playedOn });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid score data",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const viewer = await requireUser();
    const newScore = await ScoreService.addScore(viewer.user.id, parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/scores");
    return { success: true, data: newScore };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return { success: false, error: err.message, code: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to record score";
    return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
  }
}

/**
 * Server Action: Update an existing score value or date.
 */
export async function updateScoreAction(
  id: string,
  score: number,
  playedOn: string
): Promise<ScoreActionResult<GolfScore>> {
  const parsed = updateScoreSchema.safeParse({ id, score, playedOn });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid score data",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const viewer = await requireUser();
    const updated = await ScoreService.updateScore(viewer.user.id, id, parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/scores");
    return { success: true, data: updated };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return { success: false, error: err.message, code: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to update score";
    return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
  }
}

/**
 * Server Action: Delete an existing score.
 */
export async function deleteScoreAction(id: string): Promise<ScoreActionResult<void>> {
  const parsed = deleteScoreSchema.safeParse({ id });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid score ID",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const viewer = await requireUser();
    await ScoreService.deleteScore(viewer.user.id, id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/scores");
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return { success: false, error: err.message, code: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to delete score";
    return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
  }
}

/**
 * Server Action: Admin update of a user's score with audit trail.
 */
export async function adminUpdateUserScoreAction(
  targetUserId: string,
  scoreId: string,
  score: number,
  playedOn: string
): Promise<ScoreActionResult<GolfScore>> {
  const parsed = updateScoreSchema.safeParse({ id: scoreId, score, playedOn });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid score data",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const admin = await requireAdmin();
    const updated = await ScoreService.adminUpdateUserScore(
      admin.user.id,
      targetUserId,
      scoreId,
      parsed.data
    );

    revalidatePath("/admin/users");
    return { success: true, data: updated };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return { success: false, error: err.message, code: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to update user score";
    return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
  }
}
