/**
 * Tests for auth middleware
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateSession } from "../../../lib/auth/middleware";

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

describe("auth middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("updateSession", () => {
        it("should redirect authenticated user from auth page to app", async () => {
            const { getSessionCookie } = await import("better-auth/cookies");
            const { isAuthRoute } = await import("../../../lib/auth/routes");
            
            vi.mocked(getSessionCookie).mockReturnValue("valid-session-cookie");
            vi.mocked(isAuthRoute).mockReturnValue(true);

            const request = new NextRequest("http://localhost:3000/auth/login", { headers: new Headers() });
            const response = await updateSession(request);

            expect(response.status).toBe(307); // Redirect status
            expect(response.headers.get("location")).toBe("http://localhost:3000/");
        });

        it("should allow access to API routes", async () => {
            const { getSessionCookie } = await import("better-auth/cookies");
            
            vi.mocked(getSessionCookie).mockReturnValue(null);

            const request = new NextRequest("http://localhost:3000/api/health", { headers: new Headers() });
            const response = await updateSession(request);

            expect(response.status).toBe(200);
        });

        it("should allow access to auth routes when not authenticated", async () => {
            const { getSessionCookie } = await import("better-auth/cookies");
            const { isAuthRoute } = await import("../../../lib/auth/routes");
            
            vi.mocked(getSessionCookie).mockReturnValue(null);
            vi.mocked(isAuthRoute).mockReturnValue(true);

            const request = new NextRequest("http://localhost:3000/auth/login", { headers: new Headers() });
            const response = await updateSession(request);

            expect(response.status).toBe(200);
        });

        it("should allow access to public routes", async () => {
            const { getSessionCookie } = await import("better-auth/cookies");
            const { isAuthRoute, isPublicRoute } = await import("../../../lib/auth/routes");
            
            vi.mocked(getSessionCookie).mockReturnValue(null);
            vi.mocked(isAuthRoute).mockReturnValue(false);
            vi.mocked(isPublicRoute).mockReturnValue(true);

            const request = new NextRequest("http://localhost:3000/calories", { headers: new Headers() });
            const response = await updateSession(request);

            expect(response.status).toBe(200);
        });

        it("should redirect to login for protected routes without session", async () => {
            const { getSessionCookie } = await import("better-auth/cookies");
            const { isAuthRoute, isPublicRoute } = await import("../../../lib/auth/routes");
            
            vi.mocked(getSessionCookie).mockReturnValue(null);
            vi.mocked(isAuthRoute).mockReturnValue(false);
            vi.mocked(isPublicRoute).mockReturnValue(false);

            const request = new NextRequest("http://localhost:3000/account", { headers: new Headers() });
            const response = await updateSession(request);

            expect(response.status).toBe(307); // Redirect status
            expect(response.headers.get("location")).toBe("http://localhost:3000/auth/login");
        });

        it("should allow access to protected routes with valid session", async () => {
            const { getSessionCookie } = await import("better-auth/cookies");
            const { isAuthRoute, isPublicRoute } = await import("../../../lib/auth/routes");
            
            vi.mocked(getSessionCookie).mockReturnValue("valid-session-cookie");
            vi.mocked(isAuthRoute).mockReturnValue(false);
            vi.mocked(isPublicRoute).mockReturnValue(false);

            const request = new NextRequest("http://localhost:3000/account", { headers: new Headers() });
            const response = await updateSession(request);

            expect(response.status).toBe(200);
        });

        it("should handle errors gracefully", async () => {
            const { getSessionCookie } = await import("better-auth/cookies");
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            
            vi.mocked(getSessionCookie).mockImplementation(() => {
                throw new Error("Cookie parsing error");
            });

            const request = new NextRequest("http://localhost:3000/account", { headers: new Headers() });
            const response = await updateSession(request);

            expect(response.status).toBe(200); // Should continue with original response
            expect(consoleSpy).toHaveBeenCalledWith("Better Auth middleware error:", expect.any(Error));
            
            consoleSpy.mockRestore();
        });

        it("should handle complex pathnames correctly", async () => {
            const { getSessionCookie } = await import("better-auth/cookies");
            const { isAuthRoute, isPublicRoute } = await import("../../../lib/auth/routes");
            
            vi.mocked(getSessionCookie).mockReturnValue("valid-session-cookie");
            vi.mocked(isAuthRoute).mockReturnValue(true);

            const request = new NextRequest("http://localhost:3000/auth/login?returnTo=/account", { headers: new Headers() });
            const response = await updateSession(request);

            expect(response.status).toBe(307); // Should redirect
            expect(response.headers.get("location")).toBe("http://localhost:3000/");
        });

        it("should preserve request context in response", async () => {
            const { getSessionCookie } = await import("better-auth/cookies");
            const { isAuthRoute, isPublicRoute } = await import("../../../lib/auth/routes");
            
            vi.mocked(getSessionCookie).mockReturnValue("valid-session-cookie");
            vi.mocked(isAuthRoute).mockReturnValue(false);
            vi.mocked(isPublicRoute).mockReturnValue(true);

            const headers = new Headers({ "custom-header": "test-value" });
            const request = new NextRequest("http://localhost:3000/calories", { headers });
            
            const response = await updateSession(request);

            expect(response.status).toBe(200);
            // Response should be based on the original request
        });
    });
});