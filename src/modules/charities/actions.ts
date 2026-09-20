"use server";

import { requireUser, requireAdmin } from "@/modules/auth/guards";
import { CharityService } from "./service";
import {
  updateCharitySelectionSchema,
  createCharitySchema,
  updateCharitySchema,
  createCharityEventSchema,
} from "./schemas";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function updateCharitySelectionAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    charityId: formData.get("charityId"),
    charityPercent: Number(formData.get("charityPercent")),
  };

  const parsed = updateCharitySelectionSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid charity selection",
    };
  }

  try {
    const viewer = await requireUser();
    await CharityService.updateUserCharityPreference(
      viewer.user.id,
      parsed.data.charityId,
      parsed.data.charityPercent
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/charity");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update charity selection";
    return { success: false, error: message };
  }
}

export async function adminCreateCharityAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    slug: formData.get("slug"),
    name: formData.get("name"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    category: formData.get("category"),
    logoUrl: formData.get("logoUrl") || null,
    heroImageUrl: formData.get("heroImageUrl") || null,
    websiteUrl: formData.get("websiteUrl") || null,
    isFeatured: formData.get("isFeatured") === "true",
    featuredOrder: formData.get("featuredOrder")
      ? Number(formData.get("featuredOrder"))
      : null,
    isActive: formData.get("isActive") !== "false",
  };

  const parsed = createCharitySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid charity details",
    };
  }

  try {
    const admin = await requireAdmin();
    const created = await CharityService.createCharity(parsed.data, admin.user.id);

    revalidatePath("/charities");
    revalidatePath("/admin/charities");
    return { success: true, data: created };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create charity";
    return { success: false, error: message };
  }
}

export async function adminUpdateCharityAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    id: formData.get("id"),
    slug: formData.get("slug") || undefined,
    name: formData.get("name") || undefined,
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    category: formData.get("category") || undefined,
    logoUrl: formData.get("logoUrl") || null,
    heroImageUrl: formData.get("heroImageUrl") || null,
    websiteUrl: formData.get("websiteUrl") || null,
    isFeatured: formData.get("isFeatured") ? formData.get("isFeatured") === "true" : undefined,
    featuredOrder: formData.get("featuredOrder")
      ? Number(formData.get("featuredOrder"))
      : null,
    isActive: formData.get("isActive") ? formData.get("isActive") === "true" : undefined,
  };

  const parsed = updateCharitySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid update data",
    };
  }

  try {
    const admin = await requireAdmin();
    const updated = await CharityService.updateCharity(parsed.data, admin.user.id);

    revalidatePath("/charities");
    revalidatePath(`/charities/${updated.slug}`);
    revalidatePath("/admin/charities");
    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update charity";
    return { success: false, error: message };
  }
}

export async function adminArchiveCharityAction(charityId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await CharityService.archiveCharity(charityId, admin.user.id);

    revalidatePath("/charities");
    revalidatePath("/admin/charities");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to archive charity";
    return { success: false, error: message };
  }
}

export async function adminAddCharityEventAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    charityId: formData.get("charityId"),
    title: formData.get("title"),
    description: formData.get("description") || null,
    startsAt: formData.get("startsAt"),
    location: formData.get("location") || null,
    imageUrl: formData.get("imageUrl") || null,
    isPublished: formData.get("isPublished") !== "false",
  };

  const parsed = createCharityEventSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid event data",
    };
  }

  try {
    const admin = await requireAdmin();
    const event = await CharityService.addCharityEvent(parsed.data, admin.user.id);

    revalidatePath("/charities");
    revalidatePath("/admin/charities");
    return { success: true, data: event };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add charity event";
    return { success: false, error: message };
  }
}
