"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema, updateProfileSchema } from "./schemas";
import { AuthService } from "./service";
import { requireUser } from "./guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  requiresConfirmation?: boolean;
  email?: string;
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
    const rawMsg = error?.message || "";
    let friendlyError = "Invalid email or password";

    if (rawMsg.toLowerCase().includes("email not confirmed") || (error as { code?: string })?.code === "email_not_confirmed") {
      friendlyError = "Your email address has not been confirmed yet. Please check your email inbox and spam folder for the confirmation link.";
    } else if (rawMsg.toLowerCase().includes("invalid login credentials")) {
      friendlyError = "Invalid login credentials. Please check your email and password, or verify if your email confirmation is pending.";
    } else if (rawMsg.toLowerCase().includes("user not found")) {
      friendlyError = "No account found with this email. Please sign up first.";
    } else if (rawMsg.toLowerCase().includes("too many requests") || (error as { status?: number })?.status === 429) {
      friendlyError = "Too many login attempts. Please wait a few moments before trying again.";
    } else if (error?.message) {
      friendlyError = error.message;
    }

    return {
      success: false,
      error: friendlyError,
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

  // Determine application origin for email confirmation redirect
  const headersList = headers();
  const forwardedHost = headersList.get("x-forwarded-host");
  const host = forwardedHost || headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: parsed.data.fullName,
        charity_id: parsed.data.charityId,
        charity_percent: parsed.data.charityPercent,
        role: "subscriber",
      },
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Failed to create account",
    };
  }

  if (!data.user) {
    return {
      success: false,
      error: "Unable to create account. Please try again.",
    };
  }

  // If email confirmation is required, Supabase returns a user without a session
  if (!data.session) {
    return {
      success: true,
      requiresConfirmation: true,
      email: parsed.data.email,
    };
  }

  // If session is immediately established (e.g. email confirmation disabled), proceed to dashboard
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
