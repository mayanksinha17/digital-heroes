import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/modules/auth/service";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  // Determine application origin for redirects
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : requestUrl.origin;

  if (error) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", error_description || error);
    return NextResponse.redirect(loginUrl);
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let target = next;
      if (user) {
        const profile = await AuthService.getProfileById(user.id);
        if (profile?.role === "admin" && target === "/dashboard") {
          target = "/admin";
        }
      }
      const successUrl = new URL(target, origin);
      return NextResponse.redirect(successUrl);
    }
  } else if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!verifyError) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let target = next;
      if (user) {
        const profile = await AuthService.getProfileById(user.id);
        if (profile?.role === "admin" && target === "/dashboard") {
          target = "/admin";
        }
      }
      const successUrl = new URL(target, origin);
      return NextResponse.redirect(successUrl);
    }
  }

  // If verification was not successful, redirect to login with informative message
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set(
    "error",
    "Confirmation link is invalid or has expired. Please sign in with your credentials or request a new link."
  );
  return NextResponse.redirect(loginUrl);
}
