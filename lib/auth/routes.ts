/**
 * Centralized route configuration for middleware
 * This file defines all route groups and their protection levels
 */

export type RouteGroup
    = | "PUBLIC"
        | "AUTH"
        | "PROTECTED"
        | "API_PUBLIC"
        | "API_PROTECTED";

export interface RouteConfig {
    pattern: string;
    group: RouteGroup;
    description?: string;
}

/**
 * Route group definitions
 * Routes are checked in order, first match wins
 */
export const ROUTE_GROUPS: Record<RouteGroup, string[]> = {
    // Public routes - no authentication required
    PUBLIC: [
        "/",
        "/calories",
        "/recipe",
        "/health",
        "/error",
        "/debug",
        "/anleitungsgenerator",
        "/unit-converter",
        "/calories-scan",
        "/dev-scanner",
        "/auth/sign-up-success",
        "/auth/error",
        "/auth/confirm",
        "/auth/signout",
    ],

    // Authentication routes - redirect authenticated users away
    AUTH: [
        "/auth/login",
        "/auth/sign-up",
        "/auth/forgot-password",
        "/auth/update-password",
    ],

    // Protected routes - require authentication
    PROTECTED: ["/account", "/dashboard"],

    // Public API routes - no authentication required
    API_PUBLIC: ["/api/health", "/api/test-env", "/api/debug"],

    // Protected API routes - require authentication
    API_PROTECTED: [
        "/api/products",
        "/api/user",
        "/api/recipes",
        "/api/ingredients",
    ],
};

/**
 * Route configurations with patterns for dynamic matching
 */
export const ROUTE_CONFIGS: RouteConfig[] = [
    // Static file exclusions (always public)
    {
        pattern: "/_next/static",
        group: "PUBLIC",
        description: "Next.js static files",
    },
    {
        pattern: "/_next/image",
        group: "PUBLIC",
        description: "Next.js image optimization",
    },
    { pattern: "/favicon.ico", group: "PUBLIC", description: "Favicon" },
    {
        pattern: String.raw`/.*\.(svg|png|jpg|jpeg|gif|webp)$`,
        group: "PUBLIC",
        description: "Static images",
    },

    // Auth routes patterns
    { pattern: "/auth/.*", group: "AUTH", description: "Authentication pages" },

    // API route patterns
    {
        pattern: "/api/health",
        group: "API_PUBLIC",
        description: "Health check endpoint",
    },
    {
        pattern: "/api/test-env",
        group: "API_PUBLIC",
        description: "Environment test endpoint",
    },
    {
        pattern: "/api/debug",
        group: "API_PUBLIC",
        description: "Debug endpoints (development only)",
    },
    {
        pattern: "/api/.*",
        group: "API_PROTECTED",
        description: "Protected API endpoints",
    },

    // Page route patterns
    {
        pattern: "/account.*",
        group: "PROTECTED",
        description: "User account pages",
    },
    {
        pattern: "/dashboard.*",
        group: "PROTECTED",
        description: "Dashboard pages",
    },

    // Public pages (checked last)
    {
        pattern: "/calories.*",
        group: "PUBLIC",
        description: "Calorie comparison pages",
    },
    {
        pattern: "/recipe.*",
        group: "PUBLIC",
        description: "Recipe management pages",
    },
    {
        pattern: "/debug.*",
        group: "PUBLIC",
        description: "Debug pages (development only)",
    },
    {
        pattern: "/dev-scanner.*",
        group: "PUBLIC",
        description: "Developer barcode scanner testing page",
    },
    {
        pattern: "/anleitungsgenerator.*",
        group: "PUBLIC",
        description: "Instruction generator pages",
    },
    {
        pattern: "/unit-converter.*",
        group: "PUBLIC",
        description: "unit-converter pages",
    },
    { pattern: "/", group: "PUBLIC", description: "Home page" },
];

/**
 * Default redirect paths for different scenarios
 */
export const REDIRECT_PATHS = {
    LOGIN: "/auth/login",
    HOME: "/",
    ACCOUNT: "/account",
    DEFAULT_AFTER_LOGIN: "/", // Main app landing page after successful auth
    DEFAULT_AFTER_LOGOUT: "/",
} as const;

/**
 * Routes that should be accessible when user is already authenticated
 * These will redirect authenticated users to a default page
 */
export const AUTH_REDIRECT_ROUTES = ROUTE_GROUPS.AUTH;

/**
 * Check if a route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
    return (
        ROUTE_GROUPS.PROTECTED.some(
            route => pathname === route || pathname.startsWith(`${route}/`),
        )
        || ROUTE_GROUPS.API_PROTECTED.some(
            route => pathname === route || pathname.startsWith(`${route}/`),
        )
    );
}

/**
 * Check if a route is public (no auth required)
 */
export function isPublicRoute(pathname: string): boolean {
    return (
        ROUTE_GROUPS.PUBLIC.some(
            route => pathname === route || pathname.startsWith(`${route}/`),
        )
        || ROUTE_GROUPS.API_PUBLIC.some(
            route => pathname === route || pathname.startsWith(`${route}/`),
        )
    );
}

/**
 * Check if a route is an auth route (should redirect authenticated users)
 */
export function isAuthRoute(pathname: string): boolean {
    return ROUTE_GROUPS.AUTH.some(
        route => pathname === route || pathname.startsWith(`${route}/`),
    );
}

/**
 * Check if a route is an API route
 */
export function isApiRoute(pathname: string): boolean {
    return pathname.startsWith("/api/");
}

/**
 * Get the route group for a given pathname
 */
export function getRouteGroup(pathname: string): RouteGroup | null {
    // Check static files first
    if (
        pathname.startsWith("/_next/")
        || pathname === "/favicon.ico"
        || /\.(?:svg|png|jpg|jpeg|gif|webp)$/.test(pathname)
    ) {
        return "PUBLIC";
    }

    // Check API routes
    if (isApiRoute(pathname)) {
        if (isPublicRoute(pathname))
            return "API_PUBLIC";
        if (isProtectedRoute(pathname))
            return "API_PROTECTED";
        return "API_PROTECTED"; // Default API routes to protected
    }

    // Check page routes
    if (isAuthRoute(pathname))
        return "AUTH";
    if (isProtectedRoute(pathname))
        return "PROTECTED";
    if (isPublicRoute(pathname))
        return "PUBLIC";

    // Default to protected for unknown routes
    return "PROTECTED";
}
