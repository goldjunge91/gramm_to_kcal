import type { NextRequest } from "next/server";

import { updateSession } from "./lib/auth/middleware";

/**
 * Main middleware function for Better Auth
 * Handles authentication and route protection using Better Auth's built-in capabilities
 */
export async function middleware(request: NextRequest) {
    // Better Auth handles rate limiting internally, so we just need session management
    return await updateSession(request);
}

/**
 * Simplified matcher - matches all routes except static files
 * Route protection logic is handled by the centralized route system in routes.ts
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - Next.js internals (_next/static, _next/image)
         * - Static files (favicon, images)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
