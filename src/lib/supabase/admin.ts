import { createClient } from "@supabase/supabase-js";

/**
 * Service Role Admin Client
 * Invariant: Never import this in client-side code or expose to the browser.
 * Only used in secure server contexts (webhook handling, draw publishing RPC, admin verification).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
