import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/better-auth/middleware'
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit-middleware'
import { isPublicRoute } from '@/lib/middleware/routes'

/**
 * Main middleware function with multi-layer protection
 * Handles rate limiting, authentication, authorization, and route protection
 */
export async function middleware(request: NextRequest) {
  // Layer 1: Rate limiting (DDoS protection)
  const rateLimitResponse = await rateLimitMiddleware(request)
  if (rateLimitResponse && rateLimitResponse.status === 429) {
    // Rate limit exceeded - block request immediately
    return rateLimitResponse
  }

  // Layer 2: Route-Logik aus routes.ts
  const pathname = request.nextUrl.pathname

  // Layer 3: Authentifizierung und Session-Update für alle Routen
  // IMPORTANT: Always call updateSession() to prevent session expiration,
  // even on public routes, to keep authenticated users logged in
  const authResponse = await updateSession(request)

  // For public routes, merge responses without additional auth checks
  if (isPublicRoute(pathname)) {
    if (rateLimitResponse && authResponse) {
      // Merge rate limit headers with auth response
      const rateLimitHeaders = rateLimitResponse.headers
      for (const [key, value] of rateLimitHeaders.entries()) {
        if (key.startsWith('X-RateLimit') || key === 'Retry-After') {
          authResponse.headers.set(key, value)
        }
      }
    }
    return authResponse || rateLimitResponse || undefined
  }

  // For protected routes, auth response already handles redirects if needed
  // Merge rate limit headers with auth response if beide vorhanden
  if (rateLimitResponse && authResponse) {
    const rateLimitHeaders = rateLimitResponse.headers
    for (const [key, value] of rateLimitHeaders.entries()) {
      if (key.startsWith('X-RateLimit') || key === 'Retry-After') {
        authResponse.headers.set(key, value)
      }
    }
  }

  return authResponse
}

/**
 * Simplified matcher - matches all routes except static files
 * Route protection logic is handled by the centralized route system in routes.ts
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - Next.js internals (_next/static, _next/image)
     * - Static files (favicon, images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
