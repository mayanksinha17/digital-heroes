import type { Database, DrawMode, DrawStatus } from "@/types/database";
import type { DrawResult } from "./engine";

export type { DrawMode, DrawStatus };

export type DrawRow = Database["public"]["Tables"]["draws"]["Row"];
export type DrawSimulationRow = Database["public"]["Tables"]["draw_simulations"]["Row"];
export type DrawEntryRow = Database["public"]["Tables"]["draw_entries"]["Row"];
export type DrawWinnerRow = Database["public"]["Tables"]["draw_winners"]["Row"];

export interface DrawSimulationPayload {
  drawId: string;
  mode: DrawMode;
  drawnNumbers: number[];
  result: DrawResult;
}

export interface DrawPublishSummary {
  drawId: string;
  drawMonth: string;
  mode: DrawMode;
  drawnNumbers: number[];
  poolTotalCents: number;
  pool5Cents: number;
  pool4Cents: number;
  pool3Cents: number;
  rolloverOutCents: number;
  winnerCounts: {
    tier5: number;
    tier4: number;
    tier3: number;
  };
}
