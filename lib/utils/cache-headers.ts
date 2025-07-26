/**
 * HTTP Caching Utilities for API Routes
 * Provides reusable functions for implementing consistent caching strategies
 */

import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

/**
 * Creates an MD5 ETag from data
 */
export function createETag(data: unknown): string {
    return createHash("md5")
        .update(JSON.stringify(data))
        .digest("hex");
}

/**
 * Creates an ETag from data with a timestamp rounded to specified seconds
 * Useful for time-sensitive data that should cache for specific intervals
 */
export function createTimestampETag(data: unknown, roundToSeconds = 30): string {
    const now = Date.now();
    const roundedTime = Math.floor(now / (roundToSeconds * 1000)) * roundToSeconds * 1000;
    const timestampedData = {
        ...(typeof data === "object" && data !== null ? data : { value: data }),
        _timestamp: roundedTime,
    };
    return createETag(timestampedData);
}

/**
 * Checks if the client's ETag matches the current ETag
 */
export function checkETagMatch(request: NextRequest, etag: string): boolean {
    const clientETag = request.headers.get("if-none-match");
    return clientETag === etag;
}

/**
 * Creates headers for public caching (can be cached by browsers and CDNs)
 */
export function createPublicCacheHeaders(
    maxAge: number,
    staleWhileRevalidate?: number,
): Headers {
    const headers = new Headers();

    let cacheControl = `public, max-age=${maxAge}`;
    if (staleWhileRevalidate) {
        cacheControl += `, stale-while-revalidate=${staleWhileRevalidate}`;
    }

    headers.set("Cache-Control", cacheControl);
    headers.set("Vary", "Accept-Encoding");

    return headers;
}

/**
 * Creates headers for private caching (user-specific data)
 */
export function createPrivateCacheHeaders(maxAge: number): Headers {
    const headers = new Headers();
    headers.set("Cache-Control", `private, max-age=${maxAge}, must-revalidate`);
    headers.set("Vary", "Authorization");
    return headers;
}

/**
 * Creates headers to prevent caching (for mutations and sensitive data)
 */
export function createNoCacheHeaders(): Headers {
    const headers = new Headers();
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
    return headers;
}

/**
 * Creates a 304 Not Modified response with appropriate cache headers
 */
export function createNotModifiedResponse(
    etag: string,
    cacheHeaders: Headers,
): NextResponse {
    const headers = new Headers(cacheHeaders);
    headers.set("ETag", etag);

    return new NextResponse(null, {
        status: 304,
        headers,
    });
}

/**
 * Creates headers with ETag and cache control for successful responses
 */
export function createCachedResponse<T>(
    data: T,
    cacheHeaders: Headers,
    etag?: string,
): NextResponse {
    const responseETag = etag || createETag(data);
    const headers = new Headers(cacheHeaders);
    headers.set("ETag", responseETag);

    return NextResponse.json(data, { headers });
}

/**
 * High-level function to handle ETag-based caching for GET endpoints
 * Returns 304 if ETag matches, otherwise returns cached response
 */
export function handleETaggedResponse<T>(
    request: NextRequest,
    data: T,
    cacheHeaders: Headers,
    customETag?: string,
): NextResponse {
    const etag = customETag || createETag(data);

    // Check if client has cached version
    if (checkETagMatch(request, etag)) {
        return createNotModifiedResponse(etag, cacheHeaders);
    }

    // Return fresh data with cache headers
    return createCachedResponse(data, cacheHeaders, etag);
}

/**
 * Caching strategies for different route types
 */
export const CacheStrategies = {
    /**
     * For public API data that changes infrequently (product lookups, search results)
     */
    PUBLIC_API: {
        maxAge: 300, // 5 minutes
        staleWhileRevalidate: 60, // 1 minute stale
    },

    /**
     * For user-specific data (user products, recipes, etc)
     */
    USER_DATA: {
        maxAge: 60, // 1 minute (existing pattern)
    },

    /**
     * For system health and status endpoints
     */
    SYSTEM_STATUS: {
        maxAge: 30, // 30 seconds
    },

    /**
     * For admin endpoints with sensitive data
     */
    ADMIN_DATA: {
        maxAge: 10, // 10 seconds
    },
} as const;
