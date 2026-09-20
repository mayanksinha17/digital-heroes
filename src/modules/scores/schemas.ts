import { z } from "zod";

export const scoreValueSchema = z
  .number({
    required_error: "Stableford score is required",
    invalid_type_error: "Stableford score must be a number",
  })
  .int("Stableford score must be an integer")
  .min(1, "Minimum Stableford score is 1")
  .max(45, "Maximum Stableford score is 45");

export const playedDateSchema = z
  .string({
    required_error: "Score date is required",
  })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine(
    (val) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const played = new Date(val);
      played.setHours(0, 0, 0, 0);
      return played <= today;
    },
    { message: "Score date cannot be in the future" }
  );

export const createScoreSchema = z.object({
  score: scoreValueSchema,
  playedOn: playedDateSchema,
});

export const updateScoreSchema = z.object({
  id: z.string().uuid("Invalid score ID"),
  score: scoreValueSchema,
  playedOn: playedDateSchema,
});

export const deleteScoreSchema = z.object({
  id: z.string().uuid("Invalid score ID"),
});

export type CreateScoreInput = z.infer<typeof createScoreSchema>;
export type UpdateScoreInput = z.infer<typeof updateScoreSchema>;
export type DeleteScoreInput = z.infer<typeof deleteScoreSchema>;
