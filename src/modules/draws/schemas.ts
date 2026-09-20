import { z } from "zod";

export const drawModeSchema = z.enum(["random", "algorithmic"], {
  required_error: "Draw mode is required",
  invalid_type_error: "Mode must be either 'random' or 'algorithmic'",
});

export const drawStatusSchema = z.enum(["draft", "simulated", "published"]);

export const drawMonthSchema = z
  .string({ required_error: "Draw month is required" })
  .regex(/^\d{4}-\d{2}-01$/, "Draw month must be in YYYY-MM-01 format");

export const drawnNumbersSchema = z
  .array(z.number().int().min(1).max(45))
  .length(5, "Draw must contain exactly 5 numbers")
  .refine((nums) => new Set(nums).size === 5, {
    message: "Drawn numbers must be unique",
  });

export const createDrawSchema = z.object({
  drawMonth: drawMonthSchema,
  mode: drawModeSchema,
});

export const simulateDrawSchema = z.object({
  drawId: z.string().uuid("Invalid draw ID"),
  mode: drawModeSchema.optional(),
});

export const publishDrawSchema = z.object({
  drawId: z.string().uuid("Invalid draw ID"),
  simulationId: z.string().uuid("Invalid simulation ID"),
});

export type CreateDrawInput = z.infer<typeof createDrawSchema>;
export type SimulateDrawInput = z.infer<typeof simulateDrawSchema>;
export type PublishDrawInput = z.infer<typeof publishDrawSchema>;
