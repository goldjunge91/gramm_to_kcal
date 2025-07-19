/**
 * Supabase-Client für den Browser (Client-Komponenten).
 *
 * Darf NUR in Client-Komponenten oder Hooks verwendet werden.
 * Niemals in Server-Komponenten, API-Routen oder serverseitigen Funktionen importieren!
 *
 * Beispiel für Client-Import:
 * import { createClient } from "@/lib/supabase/client";
 */
import { createBrowserClient } from "@supabase/ssr";
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
