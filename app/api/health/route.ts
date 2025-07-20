import { NextResponse, type NextRequest } from "next/server";

import { getOpenFoodFactsHealth } from "@/lib/api/cached-product-lookup";
import { circuitBreakerManager } from "@/lib/circuit-breaker";
import { getURL } from "@/lib/get-url";
import {
  addRateLimitHeaders,
  checkRateLimit,
  rateLimiters,
} from "@/lib/rate-limit";
import { getRedisHealth } from "@/lib/redis";
import { createRegularClient } from "@/lib/supabase/server";
import { getAuthRateLimitHealth } from "@/lib/utils/auth-rate-limit";

export async function GET(request: NextRequest) {
  // Apply light rate limiting to health checks
  const rateLimitResult = await checkRateLimit(request, rateLimiters.api);

  if (rateLimitResult.rateLimited) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Too many health check requests. Please try again later.",
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: addRateLimitHeaders(new Headers(), rateLimitResult),
      },
    );
  }

  try {
    const supabase = await createRegularClient();

    // Test database connection
    const { error } = await supabase.from("products").select("count").limit(1);

    // Get Redis health status
    const redisHealth = await getRedisHealth();

    // Get auth rate limiting health
    const authRateLimitHealth = await getAuthRateLimitHealth();

    // Get OpenFoodFacts health
    const openFoodFactsHealth = await getOpenFoodFactsHealth();

    // Get circuit breaker health
    const circuitBreakerHealth = await circuitBreakerManager.getHealthSummary();

    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      url: getURL(),
      database: error ? "error" : "connected",
      supabase: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      services: {
        redis: redisHealth,
        authRateLimit: authRateLimitHealth,
        openFoodFacts: openFoodFactsHealth,
        circuitBreakers: circuitBreakerHealth,
      },
      rateLimit: {
        remaining: rateLimitResult.remaining,
        total: rateLimitResult.total,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      },
    };

    const headers = addRateLimitHeaders(new Headers(), rateLimitResult);
    return NextResponse.json(health, { headers });
  } catch (error) {
    const headers = addRateLimitHeaders(new Headers(), rateLimitResult);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers },
    );
  }
}
