"use server";

import { requireUser, requireAdmin } from "@/modules/auth/guards";
import { WinnerService } from "./service";
import {
  requestProofUploadSchema,
  recordProofSubmissionSchema,
  adminReviewWinnerSchema,
  adminMarkPaidSchema,
} from "./schemas";
import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";
import type { ProofUploadSession, WinnerProofRow } from "./types";

export interface WinnerActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Server Action: Authenticated winner requests a signed upload URL for screenshot proof.
 */
export async function requestProofUploadAction(
  winnerId: string,
  mimeType: "image/png" | "image/jpeg" | "image/webp",
  sizeBytes: number
): Promise<WinnerActionResult<ProofUploadSession>> {
  const parsed = requestProofUploadSchema.safeParse({ winnerId, mimeType, sizeBytes });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid upload parameters",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const viewer = await requireUser();
    const session = await WinnerService.createProofUploadSession(viewer.user.id, parsed.data);
    return { success: true, data: session };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return { success: false, error: err.message, code: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to initialize upload session";
    return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
  }
}

/**
 * Server Action: Record proof submission after upload to private bucket.
 */
export async function submitWinnerProofAction(
  winnerId: string,
  storagePath: string,
  mimeType: "image/png" | "image/jpeg" | "image/webp",
  sizeBytes: number
): Promise<WinnerActionResult<WinnerProofRow>> {
  const parsed = recordProofSubmissionSchema.safeParse({
    winnerId,
    storagePath,
    mimeType,
    sizeBytes,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid submission parameters",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const viewer = await requireUser();
    const proof = await WinnerService.recordProofSubmission(viewer.user.id, parsed.data);

    revalidatePath("/dashboard/winnings");
    revalidatePath("/dashboard");
    return { success: true, data: proof };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return { success: false, error: err.message, code: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to record proof submission";
    return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
  }
}

/**
 * Server Action: Admin reviews winner proof (approves or rejects with note).
 */
export async function adminReviewWinnerAction(
  winnerId: string,
  status: "approved" | "rejected",
  note?: string
): Promise<WinnerActionResult<void>> {
  const parsed = adminReviewWinnerSchema.safeParse({ winnerId, status, note });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid review parameters",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const admin = await requireAdmin();
    await WinnerService.adminReviewWinner(admin.user.id, parsed.data);

    revalidatePath("/admin/winners");
    revalidatePath("/dashboard/winnings");
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return { success: false, error: err.message, code: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to submit review";
    return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
  }
}

/**
 * Server Action: Admin marks approved winner payout as Paid.
 */
export async function adminMarkWinnerPaidAction(
  winnerId: string
): Promise<WinnerActionResult<void>> {
  const parsed = adminMarkPaidSchema.safeParse({ winnerId });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid winner ID",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const admin = await requireAdmin();
    await WinnerService.adminMarkWinnerPaid(admin.user.id, parsed.data.winnerId);

    revalidatePath("/admin/winners");
    revalidatePath("/dashboard/winnings");
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return { success: false, error: err.message, code: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to mark payout as paid";
    return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
  }
}
