/**
 * Digital Heroes - Typed Application Errors and Database Error Mapping
 */

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SUBSCRIPTION_REQUIRED"
  | "SUBSCRIPTION_PAST_DUE"
  | "SCORE_OUT_OF_RANGE"
  | "SCORE_DUPLICATE_DATE"
  | "SCORE_TOO_OLD"
  | "SCORE_DATE_IN_FUTURE"
  | "SCORE_LIMIT_REACHED"
  | "CHARITY_PERCENT_INVALID"
  | "CHARITY_NOT_FOUND"
  | "DRAW_NOT_FOUND"
  | "DRAW_ALREADY_PUBLISHED"
  | "DRAW_NOT_SIMULATED"
  | "DRAW_FUTURE_MONTH"
  | "DRAW_OUT_OF_ORDER"
  | "PROOF_INVALID_FILE"
  | "PROOF_SIZE_EXCEEDED"
  | "PROOF_ATTEMPTS_EXCEEDED"
  | "PAYOUT_NOT_APPROVED"
  | "PAYOUT_ALREADY_PAID"
  | "STRIPE_ERROR"
  | "INTERNAL_SERVER_ERROR";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    httpStatus: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Maps Postgres and Supabase error codes/messages to typed AppError
 */
export function mapDbError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const err = error as { message?: string; code?: string; details?: string };
  const message = err?.message || "An unexpected database error occurred";
  const code = err?.code;

  if (message.includes("SCORE_TOO_OLD")) {
    return new AppError(
      "SCORE_TOO_OLD",
      "This score date is older than your 5 retained scores and cannot be added.",
      400
    );
  }

  if (message.includes("SCORE_DATE_IN_FUTURE")) {
    return new AppError(
      "SCORE_DATE_IN_FUTURE",
      "Score date cannot be in the future.",
      400
    );
  }

  if (message.includes("golf_scores_score_check") || message.includes("between 1 and 45")) {
    return new AppError(
      "SCORE_OUT_OF_RANGE",
      "Stableford score must be an integer between 1 and 45.",
      400
    );
  }

  // Postgres unique violation
  if (code === "23505") {
    if (message.includes("golf_scores_user_id_played_on_key") || message.includes("played_on")) {
      return new AppError(
        "SCORE_DUPLICATE_DATE",
        "You already have a score recorded for this date. You may edit or delete the existing entry.",
        409
      );
    }
    if (message.includes("draws_draw_month_key")) {
      return new AppError(
        "DRAW_ALREADY_PUBLISHED",
        "A draw has already been created for this calendar month.",
        409
      );
    }
  }

  if (message.includes("charity_percent") || message.includes("charity_percent >= 10")) {
    return new AppError(
      "CHARITY_PERCENT_INVALID",
      "Charity contribution percentage must be at least 10%.",
      400
    );
  }

  if (
    message.includes("PAYOUT_NOT_APPROVED") ||
    (message.includes("payment_status") && message.includes("approved"))
  ) {
    return new AppError(
      "PAYOUT_NOT_APPROVED",
      "Payout can only be marked as Paid once the winner's proof has been approved.",
      400
    );
  }

  if (message.includes("PAYOUT_ALREADY_PAID")) {
    return new AppError(
      "PAYOUT_ALREADY_PAID",
      "Payout has already been completed for this winner.",
      400
    );
  }

  return new AppError("INTERNAL_SERVER_ERROR", message, 500);
}
