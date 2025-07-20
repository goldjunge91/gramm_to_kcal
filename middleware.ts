/* eslint-disable unicorn/prefer-string-raw */
import type { NextRequest } from "next/server";

import { rateLimitMiddleware } from "@/lib/middleware/rate-limit-middleware";
import { isPublicRoute } from "@/lib/middleware/routes";
import { updateSession } from "@/lib/supabase/middleware"; // dont change das

/**
 * Main middleware function with multi-layer protection
 * Handles rate limiting, authentication, authorization, and route protection
 */
export async function middleware(request: NextRequest) {
  // Layer 1: Rate limiting (DDoS protection)
  const rateLimitResponse = await rateLimitMiddleware(request);
  if (rateLimitResponse && rateLimitResponse.status === 429) {
    // Rate limit exceeded - block request immediately
    return rateLimitResponse;
  }

  // Layer 2: Route-Logik aus routes.ts
  const pathname = request.nextUrl.pathname;

  // Public-Routen direkt durchlassen
  if (isPublicRoute(pathname)) {
    return rateLimitResponse || undefined;
  }

  // Layer 3: Authentifizierung und Autorisierung für geschützte Routen
  const authResponse = await updateSession(request);

  // Merge rate limit headers with auth response if beide vorhanden
  if (rateLimitResponse && authResponse) {
    const rateLimitHeaders = rateLimitResponse.headers;
    for (const [key, value] of rateLimitHeaders.entries()) {
      if (key.startsWith("X-RateLimit") || key === "Retry-After") {
        authResponse.headers.set(key, value);
      }
    }
  }

  return authResponse;
}

/**
 * Simplified matcher - let the route system handle the logic
 * This matches all routes and lets our route grouping system decide protection
 */
export const config = {
  // Matcher wird jetzt dynamisch aus ROUTE_CONFIGS aus routes.ts generiert
  // Siehe lib/middleware/routes.ts für die zentrale Routenlogik
  matcher: [
    /*
     * Match all request paths except Next.js internals
     * The new route system handles all other exclusions
     */
    "/((?!_next/static|_next/image|calories|anleitungsgenerator|unit-converter|calories-scan|dev-scanner|unit-converter|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
