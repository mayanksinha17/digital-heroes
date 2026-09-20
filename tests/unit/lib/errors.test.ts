import { describe, it, expect } from "vitest";
import { AppError, mapDbError } from "@/lib/errors";

describe("lib/errors", () => {
  it("creates typed AppError with status code", () => {
    const error = new AppError("SCORE_OUT_OF_RANGE", "Score out of range", 400);
    expect(error.code).toBe("SCORE_OUT_OF_RANGE");
    expect(error.httpStatus).toBe(400);
  });

  it("maps Postgres unique violation on golf_scores to SCORE_DUPLICATE_DATE", () => {
    const dbErr = {
      code: "23505",
      message: "duplicate key value violates unique constraint 'golf_scores_user_id_played_on_key'",
    };
    const appErr = mapDbError(dbErr);
    expect(appErr.code).toBe("SCORE_DUPLICATE_DATE");
    expect(appErr.httpStatus).toBe(409);
  });

  it("maps custom Postgres trigger SCORE_TOO_OLD to AppError", () => {
    const dbErr = {
      message: "SCORE_TOO_OLD",
    };
    const appErr = mapDbError(dbErr);
    expect(appErr.code).toBe("SCORE_TOO_OLD");
    expect(appErr.httpStatus).toBe(400);
  });
});
