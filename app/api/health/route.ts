import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { getOpenFoodFactsHealth } from "@/lib/api/cached-product-lookup";
import { circuitBreakerManager } from "@/lib/circuit-breaker";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getURL } from "@/lib/get-url";
import { getRedisHealth } from "@/lib/redis";
import {
    CacheStrategies,
    createPublicCacheHeaders,
    createTimestampETag,
    handleETaggedResponse,
} from "@/lib/utils/cache-headers";

export async function GET(request: NextRequest) {
    // Log health check request for monitoring
    const ip
        = request.headers.get("x-forwarded-for")
            || request.headers.get("x-real-ip")
            || "unknown";
    console.info(`[HEALTH] Health check from IP: ${ip}`);

    try {
        // Test database connection
        let dbError = null;
        try {
            // Simple query to test database connection
            await db.execute("SELECT 1");
        }
        catch (err) {
            dbError = err;
        }

        // Get Redis health status
        const redisHealth = await getRedisHealth();

        // Get OpenFoodFacts health with request for rate limiting context
        const openFoodFactsHealth = await getOpenFoodFactsHealth();

        // Get circuit breaker health
        const circuitBreakerHealth
            = await circuitBreakerManager.getHealthSummary();

        const health = {
            status: "ok",
            timestamp: new Date().toISOString(),
            environment: env.NODE_ENV,
            url: getURL(),
            database: dbError ? "error" : "connected",
            betterAuth: {
                configured: true,
                emailAndPassword: true,
                hasGoogleAuth: !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
            },
            services: {
                redis: redisHealth,
                openFoodFacts: openFoodFactsHealth,
                circuitBreakers: circuitBreakerHealth,
            },
        };

        // Create public cache headers for health status (short TTL)
        const cacheHeaders = createPublicCacheHeaders(
            CacheStrategies.SYSTEM_STATUS.maxAge,
        );

        // Use timestamp-based ETag that rounds to 30 seconds
        // This ensures health checks can be cached briefly while staying current
        const timestampETag = createTimestampETag(health, 30);

        // Return cached response with ETag support
        return handleETaggedResponse(request, health, cacheHeaders, timestampETag);
    }
    catch (error) {
        return NextResponse.json(
            {
                status: "error",
                message:
                    error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
            { status: 500 },
        );
    }
}
