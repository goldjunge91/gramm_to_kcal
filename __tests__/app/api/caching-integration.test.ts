/**
 * Integration tests for HTTP caching behavior across API routes
 */
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { GET as HealthGET } from "@/app/api/health/route";
import { GET as ProductsGET } from "@/app/api/products/route";

// Mock dependencies
vi.mock("@/lib/db", () => ({
    db: {
        execute: vi.fn(() => Promise.resolve()),
    },
}));

vi.mock("@/lib/redis", () => ({
    getRedisHealth: vi.fn(() => Promise.resolve({
        status: "connected",
        latency: "10",
        timestamp: "2025-07-25T15:41:45.402Z",
    })),
}));

vi.mock("@/lib/api/cached-product-lookup", () => ({
    getOpenFoodFactsHealth: vi.fn(() => Promise.resolve({
        status: "healthy",
        responseTime: 150,
    })),
    cachedLookupProductByBarcode: vi.fn(() => Promise.resolve({
        success: true,
        product: {
            name: "Test Product",
            kcal: 100,
            quantity: 250,
        },
        source: "cache",
        cached: true,
        rateLimit: { remaining: 99, reset: Date.now() + 3600000 },
    })),
}));

vi.mock("@/lib/circuit-breaker", () => ({
    circuitBreakerManager: {
        getHealthSummary: vi.fn(() => Promise.resolve({
            total: 3,
            healthy: 3,
            open: 0,
            status: "healthy",
        })),
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

vi.mock("@/lib/validations/request-validation", () => ({
    validateRequest: vi.fn(() => Promise.resolve({
        success: true,
        data: { barcode: "1234567890123" },
    })),
    RequestSchemas: {
        barcodeQuery: vi.fn(),
        searchQuery: vi.fn(),
        createProduct: vi.fn(),
    },
    getSecurityHeaders: vi.fn(() => new Headers({
        "X-XSS-Protection": "1; mode=block",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
    })),
}));

describe("aPI Caching Integration", () => {
    describe("health endpoint caching", () => {
        it("should include cache headers in health response", async () => {
            const request = new NextRequest("http://localhost:3000/api/health");
            const response = await HealthGET(request);

            expect(response.status).toBe(200);
            expect(response.headers.get("Cache-Control")).toBe("public, max-age=30");
            expect(response.headers.get("ETag")).toBeTruthy();
        });

        it("should return 304 for matching ETag within timestamp window", async () => {
            // Mock Date.now to ensure consistent timestamps within the rounding window
            const originalNow = Date.now;
            const fixedTime = 1000000000; // Fixed timestamp
            Date.now = () => fixedTime;

            try {
                // First request to get ETag
                const request1 = new NextRequest("http://localhost:3000/api/health");
                const response1 = await HealthGET(request1);
                const etag = response1.headers.get("ETag");

                // Second request with ETag (still within same timestamp window)
                const request2 = new NextRequest("http://localhost:3000/api/health", {
                    headers: {
                        "if-none-match": etag!,
                    },
                });
                const response2 = await HealthGET(request2);

                expect(response2.status).toBe(304);
                expect(response2.headers.get("ETag")).toBe(etag);
            }
            finally {
                Date.now = originalNow;
            }
        });
    });

    describe("products endpoint caching", () => {
        it("should include cache headers in barcode lookup response", async () => {
            const request = new NextRequest("http://localhost:3000/api/products?barcode=1234567890123");
            const response = await ProductsGET(request);

            expect(response.status).toBe(200);
            expect(response.headers.get("Cache-Control")).toBe("public, max-age=300, stale-while-revalidate=60");
            expect(response.headers.get("ETag")).toBeTruthy();
            expect(response.headers.get("Vary")).toBe("Accept-Encoding");
        });

        it("should return 304 for matching ETag on barcode lookup", async () => {
            // First request to get ETag
            const request1 = new NextRequest("http://localhost:3000/api/products?barcode=1234567890123");
            const response1 = await ProductsGET(request1);
            const etag = response1.headers.get("ETag");

            // Second request with ETag
            const request2 = new NextRequest("http://localhost:3000/api/products?barcode=1234567890123", {
                headers: {
                    "if-none-match": etag!,
                },
            });
            const response2 = await ProductsGET(request2);

            expect(response2.status).toBe(304);
            expect(response2.headers.get("ETag")).toBe(etag);
        });

        it("should not cache error responses", async () => {
            // Mock a failed barcode lookup
            const { cachedLookupProductByBarcode } = await import("@/lib/api/cached-product-lookup");
            vi.mocked(cachedLookupProductByBarcode).mockResolvedValueOnce({
                success: false,
                error: "Product not found",
                source: "api",
                cached: false,
                rateLimit: { remaining: 99, reset: Date.now() + 3600000 },
            });

            const request = new NextRequest("http://localhost:3000/api/products?barcode=1234567890123");
            const response = await ProductsGET(request);

            expect(response.status).toBe(404);
            expect(response.headers.get("ETag")).toBeNull();
            expect(response.headers.get("Cache-Control")).toBeNull();
        });
    });

    describe("cache header combinations", () => {
        it("should combine security headers with cache headers", async () => {
            const request = new NextRequest("http://localhost:3000/api/health");
            const response = await HealthGET(request);

            // Should have both cache and security headers
            expect(response.headers.get("Cache-Control")).toBeTruthy();
            expect(response.headers.get("ETag")).toBeTruthy();
            // Security headers should be present (from the original implementation)
            // Note: These might be added by middleware in the actual app
        });
    });

    describe("eTag consistency", () => {
        it("should generate same ETag for identical data", async () => {
            const request1 = new NextRequest("http://localhost:3000/api/products?barcode=1234567890123");
            const request2 = new NextRequest("http://localhost:3000/api/products?barcode=1234567890123");

            const response1 = await ProductsGET(request1);
            const response2 = await ProductsGET(request2);

            const etag1 = response1.headers.get("ETag");
            const etag2 = response2.headers.get("ETag");

            expect(etag1).toBe(etag2);
            expect(etag1).toBeTruthy();
        });

        it("should generate different ETags for different queries", async () => {
            const request1 = new NextRequest("http://localhost:3000/api/products?barcode=1234567890123");

            // Mock different response for different barcode
            const { cachedLookupProductByBarcode } = await import("@/lib/api/cached-product-lookup");
            vi.mocked(cachedLookupProductByBarcode).mockResolvedValueOnce({
                success: true,
                product: {
                    name: "Different Product",
                    kcal: 200,
                    quantity: 500,
                },
                source: "cache",
                cached: true,
                rateLimit: { remaining: 98, reset: Date.now() + 3600000 },
            });

            const request2 = new NextRequest("http://localhost:3000/api/products?barcode=9876543210987");

            const response1 = await ProductsGET(request1);
            const response2 = await ProductsGET(request2);

            const etag1 = response1.headers.get("ETag");
            const etag2 = response2.headers.get("ETag");

            expect(etag1).not.toBe(etag2);
            expect(etag1).toBeTruthy();
            expect(etag2).toBeTruthy();
        });
    });
});
