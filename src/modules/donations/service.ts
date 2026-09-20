import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import type { Database } from "@/types/database";

export type Donation = Database["public"]["Tables"]["donations"]["Row"];

export class DonationService {
  /**
   * Creates an independent one-off donation record (D-29).
   * Note: Donations are strictly isolated from game-play and prize-pool calculations.
   */
  static async createDonation(
    charityId: string,
    amountCents: number,
    userId: string | null = null,
    currency: string = "INR"
  ): Promise<Donation> {
    if (amountCents <= 0) {
      throw new AppError("VALIDATION_ERROR", "Donation amount must be greater than zero", 400);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("donations")
      .insert({
        charity_id: charityId,
        user_id: userId,
        amount_cents: amountCents,
        currency,
        status: "pending",
      })
      .select()
      .single();

    if (error || !data) {
      throw new AppError("INTERNAL_SERVER_ERROR", error?.message || "Failed to create donation", 500);
    }

    return data as Donation;
  }

  /**
   * Completes a donation upon successful payment
   */
  static async completeDonation(
    donationId: string,
    stripePaymentIntentId?: string
  ): Promise<Donation> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("donations")
      .update({
        status: "succeeded",
        stripe_payment_intent_id: stripePaymentIntentId || null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", donationId)
      .select()
      .single();

    if (error || !data) {
      throw new AppError("INTERNAL_SERVER_ERROR", error?.message || "Failed to complete donation", 500);
    }

    return data as Donation;
  }

  /**
   * Retrieves donations by charity
   */
  static async getCharityDonations(charityId: string): Promise<Donation[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("charity_id", charityId)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return (data || []) as Donation[];
  }
}
