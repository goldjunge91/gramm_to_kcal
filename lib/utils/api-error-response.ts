/**
 * Standardized API error response system
 */

import { NextResponse } from "next/server";

import { createNoCacheHeaders } from "./cache-headers";
import { toAppError } from "./error-utils";

export function createApiErrorResponse(error: unknown, context?: string, statusOverride?: number) {
    const appError = toAppError(error, context);

    // Determine status code
    const status = statusOverride ?? 500;

    // Create security headers
    const headers = new Headers();
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-XSS-Protection", "1; mode=block");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Add no-cache headers
    const noCacheHeaders = createNoCacheHeaders();
    for (const [key, value] of noCacheHeaders.entries()) {
        headers.set(key, value);
    }

    return NextResponse.json({
        success: false,
        error: {
            type: appError.type,
            message: appError.message,
        },
    }, { status, headers });
}
