/**
 * Tests for auth routes configuration
 */
import { describe, it, expect } from "vitest";

import {
    isProtectedRoute,
    isPublicRoute,
    isAuthRoute,
    isApiRoute,
    getRouteGroup,
    ROUTE_GROUPS,
    REDIRECT_PATHS,
} from "@/lib/auth/routes";

describe("auth routes", () => {
    describe("isProtectedRoute", () => {
        it("should identify protected page routes", () => {
            expect(isProtectedRoute("/account")).toBe(true);
            expect(isProtectedRoute("/account/settings")).toBe(true);
            expect(isProtectedRoute("/dashboard")).toBe(true);
            expect(isProtectedRoute("/dashboard/stats")).toBe(true);
        });

        it("should identify protected API routes", () => {
            expect(isProtectedRoute("/api/products")).toBe(true);
            expect(isProtectedRoute("/api/user")).toBe(true);
            expect(isProtectedRoute("/api/user/profile")).toBe(true);
            expect(isProtectedRoute("/api/recipes")).toBe(true);
        });

        it("should not identify public routes as protected", () => {
            expect(isProtectedRoute("/")).toBe(false);
            expect(isProtectedRoute("/calories")).toBe(false);
            expect(isProtectedRoute("/api/health")).toBe(false);
        });

        it("should not identify auth routes as protected", () => {
            expect(isProtectedRoute("/auth/login")).toBe(false);
            expect(isProtectedRoute("/auth/sign-up")).toBe(false);
        });
    });

    describe("isPublicRoute", () => {
        it("should identify public page routes", () => {
            expect(isPublicRoute("/")).toBe(true);
            expect(isPublicRoute("/calories")).toBe(true);
            expect(isPublicRoute("/recipe")).toBe(true);
            expect(isPublicRoute("/unit-converter")).toBe(true);
            expect(isPublicRoute("/anleitungsgenerator")).toBe(true);
        });

        it("should identify public API routes", () => {
            expect(isPublicRoute("/api/health")).toBe(true);
            expect(isPublicRoute("/api/debug")).toBe(true);
            expect(isPublicRoute("/api/test-env")).toBe(true);
        });

        it("should handle sub-routes correctly", () => {
            expect(isPublicRoute("/calories/compare")).toBe(true);
            expect(isPublicRoute("/api/health/status")).toBe(true);
        });

        it("should not identify protected routes as public", () => {
            expect(isPublicRoute("/account")).toBe(false);
            expect(isPublicRoute("/api/products")).toBe(false);
        });
    });

    describe("isAuthRoute", () => {
        it("should identify auth routes", () => {
            expect(isAuthRoute("/auth/login")).toBe(true);
            expect(isAuthRoute("/auth/sign-up")).toBe(true);
            expect(isAuthRoute("/auth/forgot-password")).toBe(true);
            expect(isAuthRoute("/auth/update-password")).toBe(true);
        });

        it("should handle auth sub-routes", () => {
            expect(isAuthRoute("/auth/login/oauth")).toBe(true);
            expect(isAuthRoute("/auth/sign-up/success")).toBe(true);
        });

        it("should not identify non-auth routes", () => {
            expect(isAuthRoute("/")).toBe(false);
            expect(isAuthRoute("/account")).toBe(false);
            expect(isAuthRoute("/api/auth")).toBe(false); // API routes are different
        });
    });

    describe("isApiRoute", () => {
        it("should identify API routes", () => {
            expect(isApiRoute("/api/health")).toBe(true);
            expect(isApiRoute("/api/products")).toBe(true);
            expect(isApiRoute("/api/auth/login")).toBe(true);
            expect(isApiRoute("/api/user/profile")).toBe(true);
        });

        it("should not identify page routes as API routes", () => {
            expect(isApiRoute("/")).toBe(false);
            expect(isApiRoute("/auth/login")).toBe(false);
            expect(isApiRoute("/account")).toBe(false);
        });
    });

    describe("getRouteGroup", () => {
        it("should identify static files as public", () => {
            expect(getRouteGroup("/_next/static/chunks/main.js")).toBe("PUBLIC");
            expect(getRouteGroup("/_next/image")).toBe("PUBLIC");
            expect(getRouteGroup("/favicon.ico")).toBe("PUBLIC");
            expect(getRouteGroup("/logo.png")).toBe("PUBLIC");
            expect(getRouteGroup("/image.svg")).toBe("PUBLIC");
        });

        it("should identify API route groups", () => {
            expect(getRouteGroup("/api/health")).toBe("API_PUBLIC");
            expect(getRouteGroup("/api/products")).toBe("API_PROTECTED");
            expect(getRouteGroup("/api/user/profile")).toBe("API_PROTECTED");
            expect(getRouteGroup("/api/unknown")).toBe("API_PROTECTED"); // Default for API
        });

        it("should identify page route groups", () => {
            expect(getRouteGroup("/auth/login")).toBe("AUTH");
            expect(getRouteGroup("/account")).toBe("PROTECTED");
            expect(getRouteGroup("/")).toBe("PUBLIC");
            expect(getRouteGroup("/calories")).toBe("PUBLIC");
        });

        it("should default unknown routes to protected", () => {
            expect(getRouteGroup("/unknown-page")).toBe("PROTECTED");
            expect(getRouteGroup("/some/deep/path")).toBe("PROTECTED");
        });

        it("should handle complex paths correctly", () => {
            expect(getRouteGroup("/auth/login?returnTo=/account")).toBe("AUTH");
            expect(getRouteGroup("/api/products?search=test")).toBe("API_PROTECTED");
            expect(getRouteGroup("/calories/compare#results")).toBe("PUBLIC");
        });
    });

    describe("ROUTE_GROUPS configuration", () => {
        it("should have all required route groups", () => {
            expect(ROUTE_GROUPS.PUBLIC).toBeDefined();
            expect(ROUTE_GROUPS.AUTH).toBeDefined();
            expect(ROUTE_GROUPS.PROTECTED).toBeDefined();
            expect(ROUTE_GROUPS.API_PUBLIC).toBeDefined();
            expect(ROUTE_GROUPS.API_PROTECTED).toBeDefined();
        });

        it("should contain expected routes in each group", () => {
            expect(ROUTE_GROUPS.PUBLIC).toContain("/");
            expect(ROUTE_GROUPS.PUBLIC).toContain("/calories");
            expect(ROUTE_GROUPS.AUTH).toContain("/auth/login");
            expect(ROUTE_GROUPS.PROTECTED).toContain("/account");
            expect(ROUTE_GROUPS.API_PUBLIC).toContain("/api/health");
            expect(ROUTE_GROUPS.API_PROTECTED).toContain("/api/products");
        });
    });

    describe("REDIRECT_PATHS configuration", () => {
        it("should have all required redirect paths", () => {
            expect(REDIRECT_PATHS.LOGIN).toBe("/auth/login");
            expect(REDIRECT_PATHS.HOME).toBe("/");
            expect(REDIRECT_PATHS.ACCOUNT).toBe("/account");
            expect(REDIRECT_PATHS.DEFAULT_AFTER_LOGIN).toBe("/");
            expect(REDIRECT_PATHS.DEFAULT_AFTER_LOGOUT).toBe("/");
        });
    });

    describe("route overlap detection", () => {
        it("should not have routes in multiple conflicting groups", () => {
            const publicRoutes = new Set(ROUTE_GROUPS.PUBLIC);
            const authRoutes = new Set(ROUTE_GROUPS.AUTH);
            const protectedRoutes = new Set(ROUTE_GROUPS.PROTECTED);

            // Check for overlaps between page route groups
            const publicAuthOverlap = [...publicRoutes].filter(route => authRoutes.has(route));
            const publicProtectedOverlap = [...publicRoutes].filter(route => protectedRoutes.has(route));
            const authProtectedOverlap = [...authRoutes].filter(route => protectedRoutes.has(route));

            expect(publicAuthOverlap).toEqual([]);
            expect(publicProtectedOverlap).toEqual([]);
            expect(authProtectedOverlap).toEqual([]);
        });

        it("should not have API routes in page route groups", () => {
            const allApiRoutes = [...ROUTE_GROUPS.API_PUBLIC, ...ROUTE_GROUPS.API_PROTECTED];
            const allPageRoutes = [...ROUTE_GROUPS.PUBLIC, ...ROUTE_GROUPS.AUTH, ...ROUTE_GROUPS.PROTECTED];

            const apiInPages = allPageRoutes.filter(route => route.startsWith("/api/"));
            const pagesInApi = allApiRoutes.filter(route => !route.startsWith("/api/"));

            expect(apiInPages).toEqual([]);
            expect(pagesInApi).toEqual([]);
        });
    });
});