/**
 * Supabase-Client für den Browser (Client-Komponenten) mit Rate Limiting.
 *
 * Darf NUR in Client-Komponenten oder Hooks verwendet werden.
 * Niemals in Server-Komponenten, API-Routen oder serverseitigen Funktionen importieren!
 *
 * Beispiel für Client-Import:
 * import { createClient } from "@/lib/supabase/client";
 */
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

import { createRateLimitedSupabaseClient } from "@/lib/utils/auth-rate-limit";

export function createClient() {
  const supabase = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
