import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import { AuthService, type Profile } from "./service";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export interface ViewerContext {
  user: User;
  profile: Profile;
}

/**
 * Returns current authenticated viewer (user + profile) or null if unauthenticated.
 */
export async function getViewer(): Promise<ViewerContext | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const profile = await AuthService.getProfileById(user.id);
    if (!profile) {
      return null;
    }

    return { user, profile };
  } catch {
    return null;
  }
}

/**
 * Ensures an authenticated viewer exists, otherwise redirects to /login (or throws AppError in actions).
 */
export async function requireUser(redirectOnFail: boolean = true): Promise<ViewerContext> {
  const viewer = await getViewer();
  if (!viewer) {
    if (redirectOnFail) {
      redirect("/login");
    }
    throw new AppError("UNAUTHORIZED", "You must be signed in to perform this action", 401);
  }
  return viewer;
}

/**
 * Ensures the authenticated viewer has the 'admin' role, otherwise redirects (or throws AppError in actions).
 */
export async function requireAdmin(redirectOnFail: boolean = true): Promise<ViewerContext> {
  const viewer = await requireUser(redirectOnFail);
  if (viewer.profile.role !== "admin") {
    if (redirectOnFail) {
      redirect("/dashboard");
    }
    throw new AppError("FORBIDDEN", "Administrator privileges required", 403);
  }
  return viewer;
}

/**
 * Server Action wrapper with authentication guard
 */
export function withAuth<TInput, TOutput>(
  handler: (input: TInput, viewer: ViewerContext) => Promise<TOutput>
) {
  return async (input: TInput): Promise<{ success: true; data: TOutput } | { success: false; error: string; code: string }> => {
    try {
      const viewer = await requireUser(false);
      const data = await handler(input, viewer);
      return { success: true, data };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return { success: false, error: err.message, code: err.code };
      }
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
    }
  };
}

/**
 * Server Action wrapper with administrator authorization guard
 */
export function withAdmin<TInput, TOutput>(
  handler: (input: TInput, viewer: ViewerContext) => Promise<TOutput>
) {
  return async (input: TInput): Promise<{ success: true; data: TOutput } | { success: false; error: string; code: string }> => {
    try {
      const viewer = await requireAdmin(false);
      const data = await handler(input, viewer);
      return { success: true, data };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return { success: false, error: err.message, code: err.code };
      }
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      return { success: false, error: message, code: "INTERNAL_SERVER_ERROR" };
    }
  };
}
