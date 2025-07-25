// Hinweis: Die Next.js-Testumgebung muss eine Web-API-kompatible Headers-Klasse bereitstellen.
/**
 * Tests für auth middleware
 */
// Verwende die native Headers-Klasse von globalThis
import { describe, expect, it, vi } from "vitest";

import { evaluateAuthRoute } from "../../../lib/auth/middleware";

describe("evaluateAuthRoute", () => {
    it("should redirect authenticated user from auth page to app", () => {
        const result = evaluateAuthRoute({
            pathname: "/auth/login",
            sessionCookie: "valid-session-cookie",
            isAuth: true,
            isPublic: false,
        });
        expect(result.status).toBe(307);
        expect(result.location).toBe("/");
    });

    it("should allow access to API routes", () => {
        const result = evaluateAuthRoute({
            pathname: "/api/health",
            sessionCookie: null,
            isAuth: false,
            isPublic: false,
        });
        expect(result.status).toBe(200);
    });

    it("should allow access to auth routes when not authenticated", () => {
        const result = evaluateAuthRoute({
            pathname: "/auth/login",
            sessionCookie: null,
            isAuth: true,
            isPublic: false,
        });
        expect(result.status).toBe(200);
    });

    it("should allow access to public routes", () => {
        const result = evaluateAuthRoute({
            pathname: "/calories",
            sessionCookie: null,
            isAuth: false,
            isPublic: true,
        });
        expect(result.status).toBe(200);
    });

    it("should redirect to login for protected routes without session", () => {
        const result = evaluateAuthRoute({
            pathname: "/account",
            sessionCookie: null,
            isAuth: false,
            isPublic: false,
        });
        expect(result.status).toBe(307);
        expect(result.location).toBe("/auth/login");
    });

    it("should allow access to protected routes with valid session", () => {
        const result = evaluateAuthRoute({
            pathname: "/account",
            sessionCookie: "valid-session-cookie",
            isAuth: false,
            isPublic: false,
        });
        expect(result.status).toBe(200);
    });
});

// Mock better-auth/cookies
vi.mock("better-auth/cookies", () => ({
    getSessionCookie: vi.fn(),
}));

// Mock auth routes
vi.mock("../../../lib/auth/routes", () => ({
    isAuthRoute: vi.fn(),
    isPublicRoute: vi.fn(),
    REDIRECT_PATHS: {
        DEFAULT_AFTER_LOGIN: "/",
    },
}));
