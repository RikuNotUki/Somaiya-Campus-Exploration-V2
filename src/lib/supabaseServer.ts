import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for use in API routes only — never import this into
 * client components. All writes/reads go through our own API routes so
 * game-logic rules (gating, hidden gem assignment, redemption) are enforced
 * server-side rather than trusted to the client.
 */
export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing. Copy .env.example to .env and fill in your project's URL + service role key."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
