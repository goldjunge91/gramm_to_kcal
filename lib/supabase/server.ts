// Utility-Funktion für Social Login mit Rate Limiting

import type { Provider, SupabaseClient } from "@supabase/supabase-js";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { getURL } from "@/lib/get-url";

import { createRateLimitedSupabaseClient } from "@/lib/utils/auth-rate-limit";

export async function createClient() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );

  // Return rate-limited client in production, regular client in development
  if (env.NODE_ENV === "production") {
    return createRateLimitedSupabaseClient(supabase);
  }

  return supabase;
}

/**
 * Gibt einen regulären Supabase-Client zurück (ohne Rate Limiting).
 * Muss immer mit await aufgerufen werden!
 */
export async function createRegularClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
  // DB-Rate-Limit-Wrapper verwenden
  const { createDbRateLimitedSupabaseClient } = await import(
    "@/lib/utils/auth-rate-limit"
  );
  // Identifier kann z.B. die User-ID oder IP sein, hier als Beispiel: "server"
  return createDbRateLimitedSupabaseClient(supabase, "server");
}

/**
 * Utility-Funktion für Social Login mit korrektem Provider-Typ
 */
export async function signInWithOAuth(
  client: SupabaseClient,
  provider: Provider,
) {
  return await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: getURL() },
  });
}
