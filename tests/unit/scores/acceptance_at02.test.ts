import { describe, it, expect } from "vitest";
import { AppError } from "@/lib/errors";

interface StoredScore {
  id: string;
  userId: string;
  score: number;
  playedOn: string;
  createdAt: string;
}

/**
 * Pure simulation model mirroring Postgres DB Triggers:
 * - enforce_score_rules (advisory lock, 1-per-date unique, no future dates, reject if backdated and count >= 5)
 * - trim_scores_to_window (retains top 5 ordered by played_on desc, created_at desc)
 */
class ScoreWindowSimulator {
  private scores: StoredScore[] = [];
  private readonly maxRetained: number = 5;

  public getScores(): StoredScore[] {
    return [...this.scores].sort(
      (a, b) => new Date(b.playedOn).getTime() - new Date(a.playedOn).getTime()
    );
  }

  public addScore(score: number, playedOn: string, createdAt = new Date().toISOString()): StoredScore {
    // 1. Stableford check
    if (!Number.isInteger(score) || score < 1 || score > 45) {
      throw new AppError("SCORE_OUT_OF_RANGE", "Stableford score must be between 1 and 45", 400);
    }

    // 2. Future date check
    const today = new Date().toISOString().split("T")[0];
    if (playedOn > today) {
      throw new AppError("SCORE_DATE_IN_FUTURE", "Score date cannot be in the future", 400);
    }

    // 3. Unique date per user check
    if (this.scores.some((s) => s.playedOn === playedOn)) {
      throw new AppError("SCORE_DUPLICATE_DATE", "Score for this date already exists", 409);
    }

    // 4. Backdated check (D-10): If 5 scores exist and playedOn is older than the oldest, reject
    if (this.scores.length >= this.maxRetained) {
      const sorted = this.getScores();
      const oldestDate = sorted[sorted.length - 1].playedOn;
      if (playedOn < oldestDate) {
        throw new AppError(
          "SCORE_TOO_OLD",
          "This score date is older than your 5 retained scores and cannot be added",
          400
        );
      }
    }

    // 5. Insert
    const newEntry: StoredScore = {
      id: `score-${Math.random().toString(36).substring(2, 9)}`,
      userId: "test-user",
      score,
      playedOn,
      createdAt,
    };

    this.scores.push(newEntry);

    // 6. Trim to top 5
    this.scores = this.getScores().slice(0, this.maxRetained);
    return newEntry;
  }

  public updateScore(id: string, score: number, playedOn: string): StoredScore {
    const idx = this.scores.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new AppError("NOT_FOUND", "Score not found", 404);
    }

    // 1. Range check
    if (!Number.isInteger(score) || score < 1 || score > 45) {
      throw new AppError("SCORE_OUT_OF_RANGE", "Stableford score must be between 1 and 45", 400);
    }

    // 2. Duplicate date check (excluding self)
    if (this.scores.some((s) => s.id !== id && s.playedOn === playedOn)) {
      throw new AppError("SCORE_DUPLICATE_DATE", "Another score already exists on this date", 409);
    }

    this.scores[idx] = {
      ...this.scores[idx],
      score,
      playedOn,
    };

    this.scores = this.getScores().slice(0, this.maxRetained);
    return this.scores.find((s) => s.id === id)!;
  }

  public deleteScore(id: string): void {
    const idx = this.scores.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new AppError("NOT_FOUND", "Score not found", 404);
    }
    this.scores.splice(idx, 1);
  }
}

describe("Acceptance Test AT-02: Five-Score Rolling Window & Lifecycle Rules", () => {
  it("executes the exact worked example and retention invariant from the PRD", () => {
    const sim = new ScoreWindowSimulator();

    // Step 1: User enters initial 5 scores in chronological order
    sim.addScore(30, "2024-01-01");
    sim.addScore(32, "2024-01-05");
    sim.addScore(28, "2024-01-10");
    sim.addScore(35, "2024-01-15");
    sim.addScore(31, "2024-01-20");

    let currentScores = sim.getScores();
    expect(currentScores).toHaveLength(5);
    expect(currentScores.map((s) => ({ date: s.playedOn, score: s.score }))).toEqual([
      { date: "2024-01-20", score: 31 },
      { date: "2024-01-15", score: 35 },
      { date: "2024-01-10", score: 28 },
      { date: "2024-01-05", score: 32 },
      { date: "2024-01-01", score: 30 },
    ]);

    // Step 2: User adds 6th score (25 Jan -> 37)
    // 01 Jan -> 30 must be automatically evicted, retaining the 5 newest
    sim.addScore(37, "2024-01-25");

    currentScores = sim.getScores();
    expect(currentScores).toHaveLength(5);
    expect(currentScores.map((s) => ({ date: s.playedOn, score: s.score }))).toEqual([
      { date: "2024-01-25", score: 37 },
      { date: "2024-01-20", score: 31 },
      { date: "2024-01-15", score: 35 },
      { date: "2024-01-10", score: 28 },
      { date: "2024-01-05", score: 32 },
    ]);
    expect(currentScores.some((s) => s.playedOn === "2024-01-01")).toBe(false);

    // Step 3 (Edge Case D-10): User attempts to submit a backdated score older than all 5 (02 Jan -> 29)
    // Must be rejected with SCORE_TOO_OLD
    expect(() => {
      sim.addScore(29, "2024-01-02");
    }).toThrow(AppError);

    try {
      sim.addScore(29, "2024-01-02");
    } catch (e) {
      expect((e as AppError).code).toBe("SCORE_TOO_OLD");
    }

    // Window remains unchanged
    expect(sim.getScores()).toHaveLength(5);

    // Step 4: User submits a score intermediate in date (18 Jan -> 40)
    // It should fit into the window and evict 05 Jan (32), keeping 25 Jan, 20 Jan, 18 Jan, 15 Jan, 10 Jan
    sim.addScore(40, "2024-01-18");
    currentScores = sim.getScores();
    expect(currentScores).toHaveLength(5);
    expect(currentScores.map((s) => ({ date: s.playedOn, score: s.score }))).toEqual([
      { date: "2024-01-25", score: 37 },
      { date: "2024-01-20", score: 31 },
      { date: "2024-01-18", score: 40 },
      { date: "2024-01-15", score: 35 },
      { date: "2024-01-10", score: 28 },
    ]);

    // Step 5: User edits the 18 Jan score value from 40 to 44
    const score18Jan = currentScores.find((s) => s.playedOn === "2024-01-18")!;
    sim.updateScore(score18Jan.id, 44, "2024-01-18");

    currentScores = sim.getScores();
    expect(currentScores.find((s) => s.playedOn === "2024-01-18")?.score).toBe(44);

    // Step 6: User attempts to edit a score date to a colliding date (e.g. 20 Jan)
    expect(() => {
      sim.updateScore(score18Jan.id, 44, "2024-01-20");
    }).toThrow(AppError);

    // Step 7: User deletes the 10 Jan score
    const score10Jan = currentScores.find((s) => s.playedOn === "2024-01-10")!;
    sim.deleteScore(score10Jan.id);

    currentScores = sim.getScores();
    expect(currentScores).toHaveLength(4);
    expect(currentScores.map((s) => s.playedOn)).toEqual([
      "2024-01-25",
      "2024-01-20",
      "2024-01-18",
      "2024-01-15",
    ]);

    // Step 8: Now that only 4 scores exist, adding an older score (e.g. 02 Jan -> 29) is accepted!
    sim.addScore(29, "2024-01-02");
    currentScores = sim.getScores();
    expect(currentScores).toHaveLength(5);
    expect(currentScores.map((s) => ({ date: s.playedOn, score: s.score }))).toEqual([
      { date: "2024-01-25", score: 37 },
      { date: "2024-01-20", score: 31 },
      { date: "2024-01-18", score: 44 },
      { date: "2024-01-15", score: 35 },
      { date: "2024-01-02", score: 29 },
    ]);
  });
});
