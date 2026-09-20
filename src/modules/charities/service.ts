import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import type { Database } from "@/types/database";
import type {
  CreateCharityInput,
  UpdateCharityInput,
  CreateCharityEventInput,
  CharityFilterInput,
} from "./schemas";

export type Charity = Database["public"]["Tables"]["charities"]["Row"];
export type CharityEvent = Database["public"]["Tables"]["charity_events"]["Row"];
export type CharityMedia = Database["public"]["Tables"]["charity_media"]["Row"];

export class CharityService {
  /**
   * Retrieves all active charities with optional search and category filters.
   */
  static async getCharities(filters?: CharityFilterInput): Promise<Charity[]> {
    const supabase = createClient();
    let query = supabase
      .from("charities")
      .select("*")
      .eq("is_active", true)
      .is("archived_at", null)
      .order("featured_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.featuredOnly) {
      query = query.eq("is_featured", true);
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const term = filters.search.trim();
      query = query.or(`name.ilike.%${term}%,short_description.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) {
      throw new AppError("INTERNAL_SERVER_ERROR", error.message, 500);
    }

    return (data || []) as Charity[];
  }

  /**
   * Admin method to list all charities including inactive and archived ones.
   */
  static async getAllCharitiesAdmin(): Promise<Charity[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("charities")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError("INTERNAL_SERVER_ERROR", error.message, 500);
    }

    return (data || []) as Charity[];
  }

  /**
   * Retrieves a single charity by its unique slug.
   */
  static async getCharityBySlug(slug: string): Promise<Charity | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("charities")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Charity;
  }

  /**
   * Retrieves a single charity by ID.
   */
  static async getCharityById(id: string): Promise<Charity | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("charities")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Charity;
  }

  /**
   * Retrieves the current primary featured charity for homepage spotlight.
   */
  static async getFeaturedCharity(): Promise<Charity | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("charities")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .is("archived_at", null)
      .order("featured_order", { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Fallback to first active charity if none explicitly marked featured
      const { data: fallback } = await supabase
        .from("charities")
        .select("*")
        .eq("is_active", true)
        .is("archived_at", null)
        .limit(1)
        .maybeSingle();

      return (fallback as Charity) || null;
    }

    return data as Charity;
  }

  /**
   * Retrieves upcoming published events for a charity.
   */
  static async getCharityEvents(charityId: string): Promise<CharityEvent[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("charity_events")
      .select("*")
      .eq("charity_id", charityId)
      .eq("is_published", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });

    if (error) {
      return [];
    }

    return (data || []) as CharityEvent[];
  }

  /**
   * Updates subscriber's selected charity and contribution percentage.
   * PRD Invariant: Minimum 10% contribution strictly validated.
   */
  static async updateUserCharityPreference(
    userId: string,
    charityId: string,
    charityPercent: number
  ): Promise<void> {
    if (charityPercent < 10) {
      throw new AppError("CHARITY_PERCENT_INVALID", "Minimum charity contribution is 10%", 400);
    }

    const charity = await this.getCharityById(charityId);
    if (!charity || !charity.is_active || charity.archived_at) {
      throw new AppError("CHARITY_NOT_FOUND", "Selected charity is not available", 404);
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        charity_id: charityId,
        charity_percent: charityPercent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      throw new AppError("INTERNAL_SERVER_ERROR", error.message, 500);
    }
  }

  /* =====================================================================
   * ADMIN MANAGEMENT OPERATIONS
   * ===================================================================== */

  static async createCharity(input: CreateCharityInput, adminId: string): Promise<Charity> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("charities")
      .insert({
        slug: input.slug,
        name: input.name,
        short_description: input.shortDescription,
        description: input.description,
        category: input.category,
        logo_url: input.logoUrl || null,
        hero_image_url: input.heroImageUrl || null,
        website_url: input.websiteUrl || null,
        is_featured: input.isFeatured,
        featured_order: input.featuredOrder || null,
        is_active: input.isActive,
      })
      .select()
      .single();

    if (error || !data) {
      throw new AppError("INTERNAL_SERVER_ERROR", error?.message || "Failed to create charity", 500);
    }

    // Log admin action
    await supabase.from("audit_log").insert({
      actor_id: adminId,
      action: "charity.create",
      entity_type: "charities",
      entity_id: data.id,
      before_data: null,
      after_data: data as unknown as Record<string, unknown>,
    });

    return data as Charity;
  }

  static async updateCharity(input: UpdateCharityInput, adminId: string): Promise<Charity> {
    const supabase = createClient();
    const existing = await this.getCharityById(input.id);
    if (!existing) {
      throw new AppError("CHARITY_NOT_FOUND", "Charity not found", 404);
    }

    const payload: Partial<Database["public"]["Tables"]["charities"]["Update"]> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) payload.name = input.name;
    if (input.slug !== undefined) payload.slug = input.slug;
    if (input.shortDescription !== undefined) payload.short_description = input.shortDescription;
    if (input.description !== undefined) payload.description = input.description;
    if (input.category !== undefined) payload.category = input.category;
    if (input.logoUrl !== undefined) payload.logo_url = input.logoUrl;
    if (input.heroImageUrl !== undefined) payload.hero_image_url = input.heroImageUrl;
    if (input.websiteUrl !== undefined) payload.website_url = input.websiteUrl;
    if (input.isFeatured !== undefined) payload.is_featured = input.isFeatured;
    if (input.featuredOrder !== undefined) payload.featured_order = input.featuredOrder;
    if (input.isActive !== undefined) payload.is_active = input.isActive;

    const { data, error } = await supabase
      .from("charities")
      .update(payload)
      .eq("id", input.id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError("INTERNAL_SERVER_ERROR", error?.message || "Failed to update charity", 500);
    }

    // Log admin action
    await supabase.from("audit_log").insert({
      actor_id: adminId,
      action: "charity.update",
      entity_type: "charities",
      entity_id: input.id,
      before_data: existing as unknown as Record<string, unknown>,
      after_data: data as unknown as Record<string, unknown>,
    });

    return data as Charity;
  }

  static async archiveCharity(id: string, adminId: string): Promise<void> {
    const supabase = createClient();
    const existing = await this.getCharityById(id);
    if (!existing) {
      throw new AppError("CHARITY_NOT_FOUND", "Charity not found", 404);
    }

    // Soft delete to protect financial contribution history (D-30)
    const { error } = await supabase
      .from("charities")
      .update({
        is_active: false,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new AppError("INTERNAL_SERVER_ERROR", error.message, 500);
    }

    // Log admin action
    await supabase.from("audit_log").insert({
      actor_id: adminId,
      action: "charity.archive",
      entity_type: "charities",
      entity_id: id,
      before_data: existing as unknown as Record<string, unknown>,
      after_data: { is_active: false, archived: true },
    });
  }

  static async addCharityEvent(input: CreateCharityEventInput, adminId: string): Promise<CharityEvent> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("charity_events")
      .insert({
        charity_id: input.charityId,
        title: input.title,
        description: input.description || null,
        starts_at: input.startsAt,
        location: input.location || null,
        image_url: input.imageUrl || null,
        is_published: input.isPublished,
      })
      .select()
      .single();

    if (error || !data) {
      throw new AppError("INTERNAL_SERVER_ERROR", error?.message || "Failed to add charity event", 500);
    }

    // Log admin action
    await supabase.from("audit_log").insert({
      actor_id: adminId,
      action: "charity_event.create",
      entity_type: "charity_events",
      entity_id: data.id,
      before_data: null,
      after_data: data as unknown as Record<string, unknown>,
    });

    return data as CharityEvent;
  }
}
