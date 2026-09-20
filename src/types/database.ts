/**
 * Digital Heroes - Supabase TypeScript Database Types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "subscriber" | "admin";
export type BillingInterval = "month" | "year";
export type SubscriptionStatus =
  | "incomplete"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete_expired";
export type DrawMode = "random" | "algorithmic";
export type DrawStatus = "draft" | "simulated" | "published";
export type VerificationStatus =
  | "awaiting_proof"
  | "pending_review"
  | "approved"
  | "rejected";
export type PaymentStatus = "pending" | "paid";
export type DonationStatus = "pending" | "succeeded" | "failed";

export interface Database {
  public: {
    Tables: {
      platform_settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      charities: {
        Row: {
          id: string;
          slug: string;
          name: string;
          short_description: string;
          description: string;
          category: string | null;
          logo_url: string | null;
          hero_image_url: string | null;
          website_url: string | null;
          is_featured: boolean;
          featured_order: number | null;
          is_active: boolean;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          short_description: string;
          description: string;
          category?: string | null;
          logo_url?: string | null;
          hero_image_url?: string | null;
          website_url?: string | null;
          is_featured?: boolean;
          featured_order?: number | null;
          is_active?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          short_description?: string;
          description?: string;
          category?: string | null;
          logo_url?: string | null;
          hero_image_url?: string | null;
          website_url?: string | null;
          is_featured?: boolean;
          featured_order?: number | null;
          is_active?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      charity_events: {
        Row: {
          id: string;
          charity_id: string;
          title: string;
          description: string | null;
          starts_at: string;
          location: string | null;
          image_url: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          charity_id: string;
          title: string;
          description?: string | null;
          starts_at: string;
          location?: string | null;
          image_url?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          charity_id?: string;
          title?: string;
          description?: string | null;
          starts_at?: string;
          location?: string | null;
          image_url?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
      };
      charity_media: {
        Row: {
          id: string;
          charity_id: string;
          storage_path: string;
          alt_text: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          charity_id: string;
          storage_path: string;
          alt_text?: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          charity_id?: string;
          storage_path?: string;
          alt_text?: string;
          sort_order?: number;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          charity_id: string | null;
          charity_percent: number;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          charity_id?: string | null;
          charity_percent?: number;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          charity_id?: string | null;
          charity_percent?: number;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          code: string;
          name: string;
          billing_interval: BillingInterval;
          price_cents: number;
          currency: string;
          stripe_price_id: string | null;
          is_active: boolean;
          monthly_equivalent_cents: number;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          billing_interval: BillingInterval;
          price_cents: number;
          currency?: string;
          stripe_price_id?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          billing_interval?: BillingInterval;
          price_cents?: number;
          currency?: string;
          stripe_price_id?: string | null;
          is_active?: boolean;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          status: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          stripe_subscription_id?: string;
          stripe_customer_id?: string;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      golf_scores: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          played_on: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score: number;
          played_on: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          score?: number;
          played_on?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      draws: {
        Row: {
          id: string;
          draw_month: string;
          mode: DrawMode;
          status: DrawStatus;
          config: Json;
          drawn_numbers: number[] | null;
          active_subscriber_count: number | null;
          entry_count: number | null;
          pool_breakdown: Json | null;
          pool_new_cents: number | null;
          rollover_in_cents: number;
          pool_total_cents: number | null;
          pool_5_cents: number | null;
          pool_4_cents: number | null;
          pool_3_cents: number | null;
          rollover_out_cents: number | null;
          unallocated_cents: number | null;
          published_at: string | null;
          published_by: string | null;
          published_simulation_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          draw_month: string;
          mode: DrawMode;
          status?: DrawStatus;
          config?: Json;
          drawn_numbers?: number[] | null;
          active_subscriber_count?: number | null;
          entry_count?: number | null;
          pool_breakdown?: Json | null;
          pool_new_cents?: number | null;
          rollover_in_cents?: number;
          pool_total_cents?: number | null;
          pool_5_cents?: number | null;
          pool_4_cents?: number | null;
          pool_3_cents?: number | null;
          rollover_out_cents?: number | null;
          unallocated_cents?: number | null;
          published_at?: string | null;
          published_by?: string | null;
          published_simulation_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          draw_month?: string;
          mode?: DrawMode;
          status?: DrawStatus;
          config?: Json;
          drawn_numbers?: number[] | null;
          active_subscriber_count?: number | null;
          entry_count?: number | null;
          pool_breakdown?: Json | null;
          pool_new_cents?: number | null;
          rollover_in_cents?: number;
          pool_total_cents?: number | null;
          pool_5_cents?: number | null;
          pool_4_cents?: number | null;
          pool_3_cents?: number | null;
          rollover_out_cents?: number | null;
          unallocated_cents?: number | null;
          published_at?: string | null;
          published_by?: string | null;
          published_simulation_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      draw_simulations: {
        Row: {
          id: string;
          draw_id: string;
          mode: DrawMode;
          config: Json;
          drawn_numbers: number[];
          result: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          draw_id: string;
          mode: DrawMode;
          config: Json;
          drawn_numbers: number[];
          result: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          draw_id?: string;
          mode?: DrawMode;
          config?: Json;
          drawn_numbers?: number[];
          result?: Json;
          created_by?: string | null;
          created_at?: string;
        };
      };
      draw_entries: {
        Row: {
          id: string;
          draw_id: string;
          user_id: string;
          scores: number[];
          match_count: number;
          tier: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          draw_id: string;
          user_id: string;
          scores: number[];
          match_count?: number;
          tier?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          draw_id?: string;
          user_id?: string;
          scores?: number[];
          match_count?: number;
          tier?: number | null;
          created_at?: string;
        };
      };
      draw_winners: {
        Row: {
          id: string;
          draw_id: string;
          entry_id: string;
          user_id: string;
          tier: number;
          prize_cents: number;
          verification_status: VerificationStatus;
          proof_attempts: number;
          review_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          payment_status: PaymentStatus;
          paid_at: string | null;
          paid_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          draw_id: string;
          entry_id: string;
          user_id: string;
          tier: number;
          prize_cents: number;
          verification_status?: VerificationStatus;
          proof_attempts?: number;
          review_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          payment_status?: PaymentStatus;
          paid_at?: string | null;
          paid_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          draw_id?: string;
          entry_id?: string;
          user_id?: string;
          tier?: number;
          prize_cents?: number;
          verification_status?: VerificationStatus;
          proof_attempts?: number;
          review_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          payment_status?: PaymentStatus;
          paid_at?: string | null;
          paid_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      winner_proofs: {
        Row: {
          id: string;
          winner_id: string;
          attempt_no: number;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          winner_id: string;
          attempt_no: number;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          winner_id?: string;
          attempt_no?: number;
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number;
          uploaded_at?: string;
        };
      };
      subscription_payments: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          stripe_invoice_id: string;
          gross_cents: number;
          currency: string;
          charity_id: string;
          charity_percent: number;
          charity_cents: number;
          paid_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          stripe_invoice_id: string;
          gross_cents: number;
          currency: string;
          charity_id: string;
          charity_percent: number;
          charity_cents: number;
          paid_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string | null;
          stripe_invoice_id?: string;
          gross_cents?: number;
          currency?: string;
          charity_id?: string;
          charity_percent?: number;
          charity_cents?: number;
          paid_at?: string;
          created_at?: string;
        };
      };
      donations: {
        Row: {
          id: string;
          user_id: string | null;
          charity_id: string;
          amount_cents: number;
          currency: string;
          status: DonationStatus;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          charity_id: string;
          amount_cents: number;
          currency?: string;
          status?: DonationStatus;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          charity_id?: string;
          amount_cents?: number;
          currency?: string;
          status?: DonationStatus;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          before_data: Json | null;
          after_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          before_data?: Json | null;
          after_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          before_data?: Json | null;
          after_data?: Json | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      has_active_subscription: {
        Args: {
          uid: string;
        };
        Returns: boolean;
      };
      published_draw_results: {
        Args: {
          p_draw_id: string;
        };
        Returns: Json;
      };
      get_admin_reports: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
    };
  };
}
