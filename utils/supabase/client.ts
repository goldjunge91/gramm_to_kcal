/**
 * Supabase-Client für den Browser (Client-Komponenten) mit Rate Limiting.
 *
 * Darf NUR in Client-Komponenten oder Hooks verwendet werden.
 * Niemals in Server-Komponenten, API-Routen oder serverseitigen Funktionen importieren!
 *
 * Beispiel für Client-Import:
 * import { createClient } from "@/utils/supabase/client";
 */
import { createBrowserClient } from "@supabase/ssr";

import { createRateLimitedSupabaseClient } from "./auth-rate-limit";

export function createClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Return rate-limited client in production, regular client in development
  if (process.env.NODE_ENV === "production") {
    return createRateLimitedSupabaseClient(supabase);
  }

  return supabase;
}

// Export regular client for cases where rate limiting should be bypassed
export function createRegularClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
