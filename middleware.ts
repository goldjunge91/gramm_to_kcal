/* eslint-disable unicorn/prefer-string-raw */
import type { NextRequest } from "next/server";

import { authMiddleware } from "@/lib/middleware/auth-middleware";
import { rateLimitMiddleware } from "@/lib/middleware/rate-limit-middleware";

/**
 * Main middleware function with multi-layer protection
 * Handles rate limiting, authentication, authorization, and route protection
 */
export async function middleware(request: NextRequest) {
  // Enable debug mode in development
  const debug = process.env.NODE_ENV === "development";

  // Layer 1: Rate limiting (DDoS protection)
  const rateLimitResponse = await rateLimitMiddleware(request);
  if (rateLimitResponse && rateLimitResponse.status === 429) {
    // Rate limit exceeded - block request immediately
    return rateLimitResponse;
  }

  // Layer 2: Authentication and authorization
  const authResponse = await authMiddleware(request, {
    debug,
    // Optional: Add API key authentication
    // apiKeyHeader: "x-api-key",
    // allowedApiKeys: process.env.API_KEYS?.split(",") || [],
  });

  // Merge rate limit headers with auth response if both succeeded
  if (rateLimitResponse && authResponse) {
    // Copy rate limit headers to auth response
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
  matcher: [
    /*
     * Match all request paths except Next.js internals
     * The new route system handles all other exclusions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
