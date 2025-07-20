/* eslint-disable unused-imports/no-unused-vars */
import { NextResponse, type NextRequest } from "next/server";

import {
  addRateLimitHeaders,
  keyGenerators,
  RateLimiter,
} from "@/lib/rate-limit";

// Rate limit configurations for different route types
const RATE_LIMIT_CONFIGS = {
  // API routes - general protection
  api: {
    requests: 100,
    window: 60, // 1 minute
    keyGenerator: keyGenerators.ip,
  },

  // Auth routes - stricter limits
  auth: {
    requests: 10,
    window: 60, // 1 minute
    keyGenerator: keyGenerators.ip,
  },

  // External API proxies - very strict (OpenFoodFacts limits)
  external: {
    requests: 30,
    window: 60, // 1 minute
    keyGenerator: keyGenerators.ip,
  },

  // File uploads - very strict
  upload: {
    requests: 5,
    window: 60, // 1 minute
    keyGenerator: keyGenerators.ip,
  },
} as const;

// Route patterns and their corresponding rate limit configs
const ROUTE_PATTERNS = [
  { pattern: /^\/api\/auth\//, config: "auth" },
  { pattern: /^\/api\/products\//, config: "external" },
  { pattern: /^\/api\/upload\//, config: "upload" },
  { pattern: /^\/api\//, config: "api" },
] as const;

type RateLimitConfigKey = keyof typeof RATE_LIMIT_CONFIGS;

// Create rate limiters
const rateLimiters = new Map<RateLimitConfigKey, RateLimiter>();

// Initialize rate limiters
for (const [key, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
  rateLimiters.set(key as RateLimitConfigKey, new RateLimiter(config));
}

// Initialize Redis storage when available
export function initializeRateLimitRedis(redis: any) {
  // This will be called from your app initialization
  // The rate-limit.ts file handles the Redis integration
}

// Determine which rate limiter to use based on the route
function getRateLimiterForRoute(pathname: string): RateLimiter | null {
  // Skip rate limiting for static assets and internal Next.js routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/.test(pathname) ||
    pathname.startsWith("/__")
  ) {
    return null;
  }

  // Find matching pattern
  for (const { pattern, config } of ROUTE_PATTERNS) {
    if (pattern.test(pathname)) {
      return rateLimiters.get(config) || null;
    }
  }

  // Default: no rate limiting for pages (only API routes)
  return null;
}

// Validate request before rate limiting
function isValidRequest(request: NextRequest): boolean {
  // Check request size
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > 10 * 1024 * 1024) {
    // 10MB limit
    return false;
  }

  // Check for suspicious user agents
  const userAgent = request.headers.get("user-agent") || "";
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    // Add more patterns as needed
  ];

  // Allow legitimate bots but flag obvious scrapers
  const isSuspicious = suspiciousPatterns.some(
    (pattern) =>
      pattern.test(userAgent) &&
      !userAgent.includes("Google") &&
      !userAgent.includes("Bing"),
  );

  if (isSuspicious) {
    console.warn(`Suspicious user agent: ${userAgent}`);
    // Still allow but log for monitoring
  }

  return true;
}

// Main rate limiting middleware
export async function rateLimitMiddleware(
  request: NextRequest,
): Promise<NextResponse | null> {
  const pathname = new URL(request.url).pathname;

  // Get appropriate rate limiter
  const rateLimiter = getRateLimiterForRoute(pathname);

  if (!rateLimiter) {
    // No rate limiting for this route
    return null;
  }

  // Validate request
  if (!isValidRequest(request)) {
    return new NextResponse("Request validation failed", {
      status: 400,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  try {
    // Check rate limit
    const result = await rateLimiter.checkLimit(request);

    // Always add rate limit headers for transparency
    const headers = addRateLimitHeaders(new Headers(), result);

    if (result.rateLimited) {
      // Rate limit exceeded
      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...Object.fromEntries(headers.entries()),
          },
        },
      );
    }

    // Rate limit passed - continue with headers
    const response = NextResponse.next();

    // Add rate limit headers to successful responses
    for (const [key, value] of headers.entries()) {
      response.headers.set(key, value);
    }

    return response;
  } catch (error) {
    console.error("Rate limiting error:", error);

    // Fail open - allow request if rate limiting fails
    const response = NextResponse.next();
    response.headers.set(
      "X-RateLimit-Error",
      "Rate limiting temporarily unavailable",
    );
    return response;
  }
}

// Emergency rate limiting (for DDoS protection)
export const EMERGENCY_RATE_LIMITER: RateLimiter = new RateLimiter({
  requests: 10,
  window: 10, // 10 seconds - very strict
  keyGenerator: keyGenerators.ip,
});

export async function emergencyRateLimit(
  request: NextRequest,
): Promise<boolean> {
  try {
    const limiter =
      (globalThis as any).EMERGENCY_RATE_LIMITER ?? EMERGENCY_RATE_LIMITER;
    const result = await limiter.checkLimit(request);
    return result.rateLimited;
  } catch {
    return false; // Fail open
  }
}

// Export rate limiters for testing and direct use
export { RATE_LIMIT_CONFIGS, rateLimiters };
