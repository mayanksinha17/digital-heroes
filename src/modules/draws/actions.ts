"use server";

import { requireAdmin } from "@/modules/auth/guards";
import { DrawService } from "./service";
import {
  createDrawSchema,
  simulateDrawSchema,
  publishDrawSchema,
} from "./schemas";
import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";
import type { DrawRow, DrawSimulationRow, DrawPublishSummary } from "./types";
import type { DrawResult } from "./engine";

export interface DrawActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Server Action: Admin creates a monthly draft draw.
 */
export async function adminCreateDrawAction(
  drawMonth: string,
  mode: "random" | "algorithmic"
): Promise<DrawActionResult<DrawRow>> {
  const parsed = createDrawSchema.safeParse({ drawMonth, mode });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid draw parameters",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const admin = await requireAdmin();
    const created = await DrawService.createMonthlyDraw(admin.user.id, parsed.data);

    revalidatePath("/admin/draws");
    return { success: true, data: created };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return { success: false, error: err.message, code: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to create draw";
    return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
  }
}

/**
 * Server Action: Admin simulates a draw.
 */
export async function adminSimulateDrawAction(
  drawId: string,
  mode?: "random" | "algorithmic"
): Promise<DrawActionResult<{ simulation: DrawSimulationRow; result: DrawResult }>> {
  const parsed = simulateDrawSchema.safeParse({ drawId, mode });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid simulation parameters",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const admin = await requireAdmin();
    const simulationResult = await DrawService.simulateDraw(admin.user.id, parsed.data);

    revalidatePath(`/admin/draws/${drawId}`);
    revalidatePath("/admin/draws");
    return { success: true, data: simulationResult };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return { success: false, error: err.message, code: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to simulate draw";
    return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
  }
}

/**
 * Server Action: Admin atomically publishes a simulated draw.
 */
export async function adminPublishDrawAction(
  drawId: string,
  simulationId: string
): Promise<DrawActionResult<DrawPublishSummary>> {
  const parsed = publishDrawSchema.safeParse({ drawId, simulationId });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid publish parameters",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const admin = await requireAdmin();
    const summary = await DrawService.publishDraw(admin.user.id, parsed.data);

    revalidatePath(`/admin/draws/${drawId}`);
    revalidatePath("/admin/draws");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/winnings");
    return { success: true, data: summary };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return { success: false, error: err.message, code: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to publish draw";
    return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
  }
}
