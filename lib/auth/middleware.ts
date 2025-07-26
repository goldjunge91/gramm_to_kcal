/**
 * Evaluates the auth logic for a given route and session.
 * @returns { status: number, location?: string }
 */
import type { NextRequest } from "next/server";

import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";

import { isAuthRoute, isPublicRoute, REDIRECT_PATHS } from "@/lib/auth/routes";
import { createRequestLogger } from "@/lib/utils/logger";

/**
 * Validates the Origin header for CSRF protection
 */
function validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "http";

    // If no origin header, check if it's a same-site request
    if (!origin) {
        // Allow requests without origin for same-site navigation
        const referer = request.headers.get("referer");
        if (referer) {
            const refererUrl = new URL(referer);
            return refererUrl.host === host;
        }
        // Allow GET requests without origin (browser navigation)
        return request.method === "GET";
    }

    // List of trusted origins (should match auth.ts configuration)
    const trustedOrigins = [
        `${protocol}://${host}`,
        "http://localhost:3000",
        "http://localhost:3001",
        "https://localhost:3000",
        process.env.NEXT_PUBLIC_URL,
    ].filter(Boolean);

    return trustedOrigins.includes(origin);
}

/**
 * Enhanced CSRF protection for state-changing requests
 */
function validateCSRF(request: NextRequest): boolean {
    // Only validate CSRF for state-changing methods
    const stateMethods = ["POST", "PUT", "DELETE", "PATCH"];
    if (!stateMethods.includes(request.method)) {
        return true;
    }

    // Validate origin for state-changing requests
    if (!validateOrigin(request)) {
        return false;
    }

    // Additional validation for API routes
    if (request.nextUrl.pathname.startsWith("/api/")) {
        const contentType = request.headers.get("content-type");

        // Ensure API requests use proper content type
        if (contentType && !contentType.includes("application/json")) {
            return false;
        }
    }

    return true;
}

export function evaluateAuthRoute({
    pathname,
    sessionCookie,
    isAuth,
    isPublic,
}: {
    pathname: string;
    sessionCookie: string | null;
    isAuth: boolean;
    isPublic: boolean;
}): { status: number; location?: string } {
    if (sessionCookie && isAuth) {
        return { status: 307, location: REDIRECT_PATHS.DEFAULT_AFTER_LOGIN };
    }
    if (pathname.startsWith("/api/")) {
        return { status: 200 };
    }
    if (isAuth) {
        return { status: 200 };
    }
    if (isPublic) {
        return { status: 200 };
    }
    if (!sessionCookie) {
        return { status: 307, location: "/auth/login" };
    }
    return { status: 200 };
}

export async function updateSession(request: NextRequest) {
    const response = NextResponse.next({
        request,
    });

    try {
        const pathname = request.nextUrl.pathname;
        const logger = createRequestLogger(request);

        // CSRF Protection: Validate origin for state-changing requests
        if (!validateCSRF(request)) {
            logger.warn("CSRF validation failed", {
                origin: request.headers.get("origin"),
                method: request.method,
                pathname,
                userAgent: request.headers.get("user-agent"),
            });

            return new NextResponse("Forbidden: Invalid origin", {
                status: 403,
                headers: {
                    "Content-Type": "text/plain",
                },
            });
        }

        // Use Better Auth's helper to check for session cookie
        const sessionCookie = getSessionCookie(request);

        // If user has session and is on auth page, redirect to app
        if (sessionCookie && isAuthRoute(pathname)) {
            const url = request.nextUrl.clone();
            url.pathname = REDIRECT_PATHS.DEFAULT_AFTER_LOGIN;
            return NextResponse.redirect(url);
        }

        // For API routes, add security headers
        if (pathname.startsWith("/api/")) {
            // Add security headers to API responses
            response.headers.set("X-Content-Type-Options", "nosniff");
            response.headers.set("X-Frame-Options", "DENY");
            response.headers.set("X-XSS-Protection", "1; mode=block");
            response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

            return response;
        }

        // Allow auth routes when no session (login, signup, etc.)
        if (isAuthRoute(pathname)) {
            return response;
        }

        // Allow public routes regardless of session
        if (isPublicRoute(pathname)) {
            return response;
        }

        // If no session and trying to access protected route, redirect to login
        if (!sessionCookie) {
            const url = request.nextUrl.clone();
            url.pathname = "/auth/login";
            return NextResponse.redirect(url);
        }

        return response;
    }
    catch (error) {
        const logger = createRequestLogger(request);
        logger.error("Better Auth middleware error", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            pathname: request.nextUrl.pathname,
        });
        return response;
    }
}
