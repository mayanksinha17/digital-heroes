import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import type { Json } from "@/types/database";

export interface PlatformSettingsRegistry {
  currency: string;
  prize_pool_percent: number;
  tier_shares: { "5": number; "4": number; "3": number };
  score_retained_count: number;
  min_scores_to_enter: number;
  backdated_score_policy: "reject" | "accept_and_trim";
  algorithm_bias: "frequent" | "rare";
  algorithm_weight_smoothing: number;
  unclaimed_lower_tier_policy: "retain" | "roll_to_jackpot";
  charity_min_percent: number;
  charity_max_percent: number;
  proof_max_attempts: number;
  proof_max_size_mb: number;
  draw_timezone: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsRegistry = {
  currency: "inr",
  prize_pool_percent: 50,
  tier_shares: { "5": 40, "4": 35, "3": 25 },
  score_retained_count: 5,
  min_scores_to_enter: 5,
  backdated_score_policy: "reject",
  algorithm_bias: "frequent",
  algorithm_weight_smoothing: 1,
  unclaimed_lower_tier_policy: "retain",
  charity_min_percent: 10,
  charity_max_percent: 50,
  proof_max_attempts: 3,
  proof_max_size_mb: 5,
  draw_timezone: "Asia/Kolkata",
};

export class SettingsService {
  /**
   * Retrieves all platform settings, falling back to defaults if database is unseeded.
   */
  static async getAllSettings(): Promise<PlatformSettingsRegistry> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("platform_settings").select("key, value");

      if (error || !data || data.length === 0) {
        return DEFAULT_PLATFORM_SETTINGS;
      }

      const settingsMap: Record<string, Json> = {};
      data.forEach((row) => {
        settingsMap[row.key] = row.value;
      });

      return {
        currency: (settingsMap.currency as string) || DEFAULT_PLATFORM_SETTINGS.currency,
        prize_pool_percent: Number(settingsMap.prize_pool_percent) || DEFAULT_PLATFORM_SETTINGS.prize_pool_percent,
        tier_shares: (settingsMap.tier_shares as { "5": number; "4": number; "3": number }) || DEFAULT_PLATFORM_SETTINGS.tier_shares,
        score_retained_count: Number(settingsMap.score_retained_count) || DEFAULT_PLATFORM_SETTINGS.score_retained_count,
        min_scores_to_enter: Number(settingsMap.min_scores_to_enter) || DEFAULT_PLATFORM_SETTINGS.min_scores_to_enter,
        backdated_score_policy: (settingsMap.backdated_score_policy as "reject" | "accept_and_trim") || DEFAULT_PLATFORM_SETTINGS.backdated_score_policy,
        algorithm_bias: (settingsMap.algorithm_bias as "frequent" | "rare") || DEFAULT_PLATFORM_SETTINGS.algorithm_bias,
        algorithm_weight_smoothing: Number(settingsMap.algorithm_weight_smoothing) || DEFAULT_PLATFORM_SETTINGS.algorithm_weight_smoothing,
        unclaimed_lower_tier_policy: (settingsMap.unclaimed_lower_tier_policy as "retain" | "roll_to_jackpot") || DEFAULT_PLATFORM_SETTINGS.unclaimed_lower_tier_policy,
        charity_min_percent: Number(settingsMap.charity_min_percent) || DEFAULT_PLATFORM_SETTINGS.charity_min_percent,
        charity_max_percent: Number(settingsMap.charity_max_percent) || DEFAULT_PLATFORM_SETTINGS.charity_max_percent,
        proof_max_attempts: Number(settingsMap.proof_max_attempts) || DEFAULT_PLATFORM_SETTINGS.proof_max_attempts,
        proof_max_size_mb: Number(settingsMap.proof_max_size_mb) || DEFAULT_PLATFORM_SETTINGS.proof_max_size_mb,
        draw_timezone: (settingsMap.draw_timezone as string) || DEFAULT_PLATFORM_SETTINGS.draw_timezone,
      };
    } catch {
      return DEFAULT_PLATFORM_SETTINGS;
    }
  }

  /**
   * Retrieves a single setting by key
   */
  static async getSetting<K extends keyof PlatformSettingsRegistry>(
    key: K
  ): Promise<PlatformSettingsRegistry[K]> {
    const all = await this.getAllSettings();
    return all[key];
  }
}
