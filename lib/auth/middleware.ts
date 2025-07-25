/**
 * Evaluates the auth logic for a given route and session.
 * @returns { status: number, location?: string }
 */
import type { NextRequest } from "next/server";

import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";

import { isAuthRoute, isPublicRoute, REDIRECT_PATHS } from "@/lib/auth/routes";
import { createRequestLogger } from "@/lib/utils/logger";

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

        // Use Better Auth's helper to check for session cookie
        const sessionCookie = getSessionCookie(request);

        // If user has session and is on auth page, redirect to app
        if (sessionCookie && isAuthRoute(pathname)) {
            const url = request.nextUrl.clone();
            url.pathname = REDIRECT_PATHS.DEFAULT_AFTER_LOGIN;
            return NextResponse.redirect(url);
        }

        // Skip API routes completely
        if (pathname.startsWith("/api/")) {
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
