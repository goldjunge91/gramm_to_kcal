/* eslint-disable unicorn/prefer-string-raw */
import type { NextRequest } from "next/server";

import { authMiddleware } from "@/lib/middleware/auth-middleware";

/**
 * Main middleware function using the new route group system
 * Handles authentication, authorization, and route protection
 */
export async function middleware(request: NextRequest) {
  // Enable debug mode in development
  const debug = process.env.NODE_ENV === "development";

  return await authMiddleware(request, {
    debug,
    // Optional: Add API key authentication
    // apiKeyHeader: "x-api-key",
    // allowedApiKeys: process.env.API_KEYS?.split(",") || [],
  });
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
