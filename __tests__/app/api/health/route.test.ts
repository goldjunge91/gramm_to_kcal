/**
 * Tests for health check API route
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/health/route";

// Mock dependencies
vi.mock("@/lib/db", () => ({
    db: {
        execute: vi.fn(),
    },
}));

vi.mock("@/lib/redis", () => ({
    getRedisHealth: vi.fn(),
}));

vi.mock("@/lib/api/cached-product-lookup", () => ({
    getOpenFoodFactsHealth: vi.fn(),
}));

vi.mock("@/lib/circuit-breaker", () => ({
    circuitBreakerManager: {
        getHealthSummary: vi.fn(),
    },
}));

vi.mock("@/lib/env", () => ({
    env: {
        NODE_ENV: "test",
        AUTH_GOOGLE_ID: "test-google-id",
        AUTH_GOOGLE_SECRET: "test-google-secret",
    },
}));

vi.mock("@/lib/get-url", () => ({
    getURL: vi.fn(() => "http://localhost:3000"),
}));

describe("/api/health", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return healthy status when all services are working", async () => {
        // Mock all dependencies to return healthy state
        const { db } = await import("@/lib/db");
        const { getRedisHealth } = await import("@/lib/redis");
        const { getOpenFoodFactsHealth } = await import(
            "@/lib/api/cached-product-lookup"
        );
        const { circuitBreakerManager } = await import("@/lib/circuit-breaker");

        vi.mocked(db.execute).mockResolvedValue({} as any);
        vi.mocked(getRedisHealth).mockResolvedValue({
            status: "connected",
            latency: 10,
            timestamp: new Date().toISOString(),
        });
        vi.mocked(getOpenFoodFactsHealth).mockResolvedValue({
            rateLimit: {
                enabled: true,
                productLimit: "10",
                searchLimit: "5",
            },
            cache: {
                enabled: true,
                productTTL: "3600",
                searchTTL: "1800",
                failureTTL: "300",
            },
            circuitBreaker: {
                state: "CLOSED" as any,
                healthy: true,
                failures: 0,
                successes: 10,
                config: {
                    failureThreshold: 5,
                    recoveryTimeout: "60000",
                    timeout: "30000",
                },
            },
            timestamp: new Date().toISOString(),
        });
        vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue({
            total: 2,
            healthy: 2,
            open: 0,
            halfOpen: 0,
            services: {
                openfoodfacts: { status: "healthy" },
                database: { status: "healthy" },
            },
        });

        const request = new NextRequest("http://localhost:3000/api/health", {
            headers: new Headers(),
        });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe("ok");
        expect(data.database).toBe("connected");
        expect(data.betterAuth.configured).toBe(true);
        expect(data.betterAuth.hasGoogleAuth).toBe(true);
        expect(data.services.redis).toMatchObject({
            status: "connected",
            latency: 10,
        });
    });

    it("should handle database connection error", async () => {
        const { db } = await import("@/lib/db");
        const { getRedisHealth } = await import("@/lib/redis");
        const { getOpenFoodFactsHealth } = await import(
            "@/lib/api/cached-product-lookup"
        );
        const { circuitBreakerManager } = await import("@/lib/circuit-breaker");

        vi.mocked(db.execute).mockRejectedValue(new Error("Connection failed"));
        vi.mocked(getRedisHealth).mockResolvedValue({
            status: "connected",
            latency: 10,
            timestamp: new Date().toISOString(),
        });
        vi.mocked(getOpenFoodFactsHealth).mockResolvedValue({
            rateLimit: {
                enabled: true,
                productLimit: "10",
                searchLimit: "5",
            },
            cache: {
                enabled: true,
                productTTL: "3600",
                searchTTL: "1800",
                failureTTL: "300",
            },
            circuitBreaker: {
                state: "CLOSED" as any,
                healthy: true,
                failures: 0,
                successes: 10,
                config: {
                    failureThreshold: 5,
                    recoveryTimeout: "60000",
                    timeout: "30000",
                },
            },
            timestamp: new Date().toISOString(),
        });
        vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue({
            total: 2,
            healthy: 2,
            open: 0,
            halfOpen: 0,
            services: {
                openfoodfacts: { status: "healthy" },
                database: { status: "healthy" },
            },
        });

        const request = new NextRequest("http://localhost:3000/api/health", {
            headers: new Headers(),
        });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe("ok");
        expect(data.database).toBe("error");
    });

    it("should return error response when health check fails", async () => {
        const { getRedisHealth } = await import("@/lib/redis");

        vi.mocked(getRedisHealth).mockRejectedValue(
            new Error("Redis connection failed"),
        );

        const request = new NextRequest("http://localhost:3000/api/health", {
            headers: new Headers(),
        });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.status).toBe("error");
        expect(data.message).toBe("Redis connection failed");
        expect(data.timestamp).toBeDefined();
    });

    it("should log IP address for monitoring", async () => {
        const consoleSpy = vi
            .spyOn(console, "info")
            .mockImplementation(() => {});

        const { db } = await import("@/lib/db");
        const { getRedisHealth } = await import("@/lib/redis");
        const { getOpenFoodFactsHealth } = await import(
            "@/lib/api/cached-product-lookup"
        );
        const { circuitBreakerManager } = await import("@/lib/circuit-breaker");

        vi.mocked(db.execute).mockResolvedValue({} as any);
        vi.mocked(getRedisHealth).mockResolvedValue({
            status: "connected",
            latency: 10,
            timestamp: new Date().toISOString(),
        });
        vi.mocked(getOpenFoodFactsHealth).mockResolvedValue({
            rateLimit: {
                enabled: true,
                productLimit: "10",
                searchLimit: "5",
            },
            cache: {
                enabled: true,
                productTTL: "3600",
                searchTTL: "1800",
                failureTTL: "300",
            },
            circuitBreaker: {
                state: "CLOSED" as any,
                healthy: true,
                failures: 0,
                successes: 10,
                config: {
                    failureThreshold: 5,
                    recoveryTimeout: "60000",
                    timeout: "30000",
                },
            },
            timestamp: new Date().toISOString(),
        });
        vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue({
            total: 2,
            healthy: 2,
            open: 0,
            halfOpen: 0,
            services: {
                openfoodfacts: { status: "healthy" },
                database: { status: "healthy" },
            },
        });

        const request = new NextRequest("http://localhost:3000/api/health", {
            headers: { "x-forwarded-for": "192.168.1.1" },
        });

        await GET(request);

        expect(consoleSpy).toHaveBeenCalledWith(
            "[HEALTH] Health check from IP: 192.168.1.1",
        );
        consoleSpy.mockRestore();
    });
});
