import { Redis } from "@upstash/redis";

import { createLogger } from "@/lib/utils/logger";

// Redis configuration
let redis: Redis | null = null;

// Initialize Redis connection
export function initializeRedis() {
    const logger = createLogger();

    // Only initialize if we have the required environment variables
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        logger.warn("Redis not configured - using in-memory rate limiting", {
            hasUrl: !!redisUrl,
            hasToken: !!redisToken,
        });
        return null;
    }

    try {
        redis = new Redis({
            url: redisUrl,
            token: redisToken,
        });

        logger.info("Redis initialized successfully", {
            redisUrl: redisUrl.replace(/\/\/.*@/, "//***@"), // Mask credentials
        });
        return redis;
    }
    catch (error) {
        logger.error("Failed to initialize Redis", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return null;
    }
}

// Get Redis instance
export function getRedis(): Redis | null {
    if (!redis) {
        return initializeRedis();
    }
    return redis;
}

// Test Redis connection
export async function testRedisConnection(): Promise<boolean> {
    const redisInstance = getRedis();
    if (!redisInstance) {
        return false;
    }

    try {
        await redisInstance.ping();
        return true;
    }
    catch (error) {
        const logger = createLogger();
        logger.error("Redis connection test failed", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return false;
    }
}

// Redis health check for monitoring
export async function getRedisHealth() {
    const redisInstance = getRedis();

    if (!redisInstance) {
        return {
            status: "disabled",
            message: "Redis not configured",
            timestamp: new Date().toISOString(),
        };
    }

    try {
        const start = Date.now();
        await redisInstance.ping();
        const latency = Date.now() - start;

        return {
            status: "healthy",
            latency: `${latency}ms`,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
        };
    }
}

// Export types
export type { Redis };
