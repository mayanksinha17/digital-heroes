import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export class AuthService {
  /**
   * Fetches profile for a given user ID
   */
  static async getProfileById(userId: string): Promise<Profile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Profile;
  }

  /**
   * Updates user profile details (fullName, charityId, charityPercent)
   * Note: role cannot be updated by users (enforced by DB check and query)
   */
  static async updateProfile(
    userId: string,
    updates: {
      fullName?: string;
      charityId?: string | null;
      charityPercent?: number;
    }
  ): Promise<Profile> {
    if (updates.charityPercent !== undefined && updates.charityPercent < 10) {
      throw new AppError("CHARITY_PERCENT_INVALID", "Minimum charity contribution is 10%", 400);
    }

    const supabase = createClient();
    const payload: Partial<Database["public"]["Tables"]["profiles"]["Update"]> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.charityId !== undefined) payload.charity_id = updates.charityId;
    if (updates.charityPercent !== undefined) payload.charity_percent = updates.charityPercent;

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select()
      .single();

    if (error || !data) {
      throw new AppError("INTERNAL_SERVER_ERROR", error?.message || "Failed to update profile", 500);
    }

    return data as Profile;
  }
}
