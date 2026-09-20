"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema, updateProfileSchema } from "./schemas";
import { AuthService } from "./service";
import { requireUser } from "./guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid input",
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      success: false,
      error: error?.message || "Invalid email or password",
    };
  }

  // Fetch user role to determine redirect
  const profile = await AuthService.getProfileById(data.user.id);
  const target = profile?.role === "admin" ? "/admin" : "/dashboard";

  revalidatePath("/", "layout");
  redirect(target);
}

export async function signupAction(
  prevState: unknown,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    charityId: formData.get("charityId") || null,
    charityPercent: formData.get("charityPercent")
      ? Number(formData.get("charityPercent"))
      : 10,
  };

  const parsed = signupSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid signup details",
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        charity_id: parsed.data.charityId,
        charity_percent: parsed.data.charityPercent,
        role: "subscriber",
      },
    },
  });

  if (error || !data.user) {
    return {
      success: false,
      error: error?.message || "Failed to create account",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function updateProfileAction(
  prevState: unknown,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    fullName: formData.get("fullName"),
    charityId: formData.get("charityId") || null,
    charityPercent: Number(formData.get("charityPercent")),
  };

  const parsed = updateProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid profile data",
    };
  }

  try {
    const viewer = await requireUser();
    await AuthService.updateProfile(viewer.user.id, {
      fullName: parsed.data.fullName,
      charityId: parsed.data.charityId,
      charityPercent: parsed.data.charityPercent,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return { success: false, error: message };
  }
}
