// Utility-Funktion für Social Login

import type { Provider, SupabaseClient } from "@supabase/supabase-js";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getURL } from "@/lib/get-url";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
