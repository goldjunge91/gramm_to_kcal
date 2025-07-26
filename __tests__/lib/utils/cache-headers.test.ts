/**
 * Tests for HTTP caching utilities
 */
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import {
    CacheStrategies,
    checkETagMatch,
    createCachedResponse,
    createETag,
    createNoCacheHeaders,
    createNotModifiedResponse,
    createPrivateCacheHeaders,
    createPublicCacheHeaders,
    createTimestampETag,
    handleETaggedResponse,
} from "@/lib/utils/cache-headers";

describe("cache-headers utilities", () => {
    describe("createETag", () => {
        it("should create consistent ETags for same data", () => {
            const data = { id: 1, name: "test" };
            const etag1 = createETag(data);
            const etag2 = createETag(data);
            expect(etag1).toBe(etag2);
        });

        it("should create different ETags for different data", () => {
            const data1 = { id: 1, name: "test1" };
            const data2 = { id: 2, name: "test2" };
            const etag1 = createETag(data1);
            const etag2 = createETag(data2);
            expect(etag1).not.toBe(etag2);
        });

        it("should return a valid MD5 hash", () => {
            const data = { test: "data" };
            const etag = createETag(data);
            expect(etag).toMatch(/^[a-f0-9]{32}$/);
        });
    });

    describe("createTimestampETag", () => {
        it("should create same ETag for timestamps within rounding window", () => {
            const data = { status: "ok" };

            // Mock Date.now() to control time
            const originalNow = Date.now;

            Date.now = () => 1000000; // 1000 seconds
            const etag1 = createTimestampETag(data, 30);

            Date.now = () => 1019999; // 1019.999s (letzter ms im selben Fenster)
            const etag2 = createTimestampETag(data, 30);

            Date.now = originalNow;

            expect(etag1).toBe(etag2);
        });

        it("should create different ETags for timestamps outside rounding window", () => {
            const data = { status: "ok" };

            const originalNow = Date.now;
            Date.now = () => 1000000; // 1000 seconds
            const etag1 = createTimestampETag(data, 30);

            Date.now = () => 1040000; // 1040 seconds (outside 30s window)
            const etag2 = createTimestampETag(data, 30);

            Date.now = originalNow;

            expect(etag1).not.toBe(etag2);
        });
    });

    describe("checkETagMatch", () => {
        it("should return true when ETags match", () => {
            const request = new NextRequest("http://localhost:3000/test", {
                headers: {
                    "if-none-match": "test-etag",
                },
            });

            expect(checkETagMatch(request, "test-etag")).toBe(true);
        });

        it("should return false when ETags don't match", () => {
            const request = new NextRequest("http://localhost:3000/test", {
                headers: {
                    "if-none-match": "different-etag",
                },
            });

            expect(checkETagMatch(request, "test-etag")).toBe(false);
        });

        it("should return false when no ETag header is present", () => {
            const request = new NextRequest("http://localhost:3000/test");

            expect(checkETagMatch(request, "test-etag")).toBe(false);
        });
    });

    describe("createPublicCacheHeaders", () => {
        it("should create basic public cache headers", () => {
            const headers = createPublicCacheHeaders(300);

            expect(headers.get("Cache-Control")).toBe("public, max-age=300");
            expect(headers.get("Vary")).toBe("Accept-Encoding");
        });

        it("should include stale-while-revalidate when specified", () => {
            const headers = createPublicCacheHeaders(300, 60);

            expect(headers.get("Cache-Control")).toBe("public, max-age=300, stale-while-revalidate=60");
        });
    });

    describe("createPrivateCacheHeaders", () => {
        it("should create private cache headers", () => {
            const headers = createPrivateCacheHeaders(60);

            expect(headers.get("Cache-Control")).toBe("private, max-age=60, must-revalidate");
            expect(headers.get("Vary")).toBe("Authorization");
        });
    });

    describe("createNoCacheHeaders", () => {
        it("should create no-cache headers", () => {
            const headers = createNoCacheHeaders();

            expect(headers.get("Cache-Control")).toBe("no-cache, no-store, must-revalidate");
            expect(headers.get("Pragma")).toBe("no-cache");
            expect(headers.get("Expires")).toBe("0");
        });
    });

    describe("createNotModifiedResponse", () => {
        it("should create 304 response with correct headers", () => {
            const cacheHeaders = createPublicCacheHeaders(300);
            const response = createNotModifiedResponse("test-etag", cacheHeaders);

            expect(response.status).toBe(304);
            expect(response.headers.get("ETag")).toBe("test-etag");
            expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
        });
    });

    describe("createCachedResponse", () => {
        it("should create response with ETag and cache headers", () => {
            const data = { test: "data" };
            const cacheHeaders = createPublicCacheHeaders(300);
            const response = createCachedResponse(data, cacheHeaders);

            expect(response.status).toBe(200);
            expect(response.headers.get("ETag")).toBeTruthy();
            expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
        });

        it("should use custom ETag when provided", () => {
            const data = { test: "data" };
            const cacheHeaders = createPublicCacheHeaders(300);
            const customETag = "custom-etag";
            const response = createCachedResponse(data, cacheHeaders, customETag);

            expect(response.headers.get("ETag")).toBe(customETag);
        });
    });

    describe("handleETaggedResponse", () => {
        it("should return 304 when ETags match", () => {
            const request = new NextRequest("http://localhost:3000/test", {
                headers: {
                    "if-none-match": "test-etag",
                },
            });
            const data = { test: "data" };
            const cacheHeaders = createPublicCacheHeaders(300);

            const response = handleETaggedResponse(request, data, cacheHeaders, "test-etag");

            expect(response.status).toBe(304);
        });

        it("should return full response when ETags don't match", async () => {
            const request = new NextRequest("http://localhost:3000/test", {
                headers: {
                    "if-none-match": "different-etag",
                },
            });
            const data = { test: "data" };
            const cacheHeaders = createPublicCacheHeaders(300);

            const response = handleETaggedResponse(request, data, cacheHeaders);

            expect(response.status).toBe(200);
            expect(response.headers.get("ETag")).toBeTruthy();

            const responseData = await response.json();
            expect(responseData).toEqual(data);
        });

        it("should generate ETag from data when not provided", () => {
            const request = new NextRequest("http://localhost:3000/test");
            const data = { test: "data" };
            const cacheHeaders = createPublicCacheHeaders(300);

            const response = handleETaggedResponse(request, data, cacheHeaders);

            const expectedETag = createETag(data);
            expect(response.headers.get("ETag")).toBe(expectedETag);
        });
    });

    describe("cacheStrategies", () => {
        it("should define PUBLIC_API strategy", () => {
            expect(CacheStrategies.PUBLIC_API.maxAge).toBe(300);
            expect(CacheStrategies.PUBLIC_API.staleWhileRevalidate).toBe(60);
        });

        it("should define USER_DATA strategy", () => {
            expect(CacheStrategies.USER_DATA.maxAge).toBe(60);
        });

        it("should define SYSTEM_STATUS strategy", () => {
            expect(CacheStrategies.SYSTEM_STATUS.maxAge).toBe(30);
        });

        it("should define ADMIN_DATA strategy", () => {
            expect(CacheStrategies.ADMIN_DATA.maxAge).toBe(10);
        });
    });
});
