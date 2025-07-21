import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { rateLimitMiddleware } from "../lib/middleware/rate-limit-middleware";
import { isAuthRoute, isPublicRoute } from "../lib/middleware/routes";
import { updateSession } from "../lib/supabase/middleware";
import { middleware } from "../middleware";

// Mock dependencies
vi.mock("../lib/middleware/rate-limit-middleware", () => ({
  rateLimitMiddleware: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../lib/middleware/routes", () => ({
  isPublicRoute: vi.fn(),
  isAuthRoute: vi.fn(),
  REDIRECT_PATHS: {
    DEFAULT_AFTER_LOGIN: "/calories",
    LOGIN: "/auth/login",
  },
}));

vi.mock("../lib/supabase/middleware", () => ({
  updateSession: vi.fn(),
}));

const mockedRateLimitMiddleware = rateLimitMiddleware as Mock;
const mockedUpdateSession = updateSession as Mock;
const mockedIsPublicRoute = isPublicRoute as Mock;
const mockedIsAuthRoute = isAuthRoute as Mock;

describe("Middleware Auth Flow", () => {
  let request: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    request = new NextRequest(new URL("http://localhost:3000/test"));

    // Default mocks
    mockedRateLimitMiddleware.mockResolvedValue(undefined);
    mockedUpdateSession.mockResolvedValue(NextResponse.next());
    mockedIsPublicRoute.mockReturnValue(false);
    mockedIsAuthRoute.mockReturnValue(false);
  });

  describe("Session Management Fix", () => {
    it("should always call updateSession for all routes (fixes session expiration bug)", async () => {
      // Test public route
      mockedIsPublicRoute.mockReturnValue(true);

      await middleware(request);

      expect(mockedUpdateSession).toHaveBeenCalledTimes(1);
      expect(mockedUpdateSession).toHaveBeenCalledWith(request);
    });

    it("should call updateSession for protected routes", async () => {
      mockedIsPublicRoute.mockReturnValue(false);

      await middleware(request);

      expect(mockedUpdateSession).toHaveBeenCalledTimes(1);
      expect(mockedUpdateSession).toHaveBeenCalledWith(request);
    });

    it("should call updateSession even when rate limited", async () => {
      // Mock rate limiting response
      const rateLimitResponse = new NextResponse(null, {
        status: 200,
        headers: {
          "X-RateLimit-Remaining": "10",
        },
      });
      mockedRateLimitMiddleware.mockResolvedValue(rateLimitResponse);
      mockedIsPublicRoute.mockReturnValue(true);

      await middleware(request);

      expect(mockedUpdateSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("Rate Limiting Integration", () => {
    it("should block requests when rate limited", async () => {
      const rateLimitResponse = new NextResponse("Too Many Requests", {
        status: 429,
      });
      mockedRateLimitMiddleware.mockResolvedValue(rateLimitResponse);

      const result = await middleware(request);

      expect(result?.status).toBe(429);
      expect(mockedUpdateSession).not.toHaveBeenCalled();
    });

    it("should merge rate limit headers with auth response", async () => {
      const rateLimitResponse = new NextResponse(null, {
        status: 200,
        headers: {
          "X-RateLimit-Remaining": "10",
          "X-RateLimit-Limit": "100",
        },
      });
      const authResponse = new NextResponse(null, {
        status: 200,
      });

      mockedRateLimitMiddleware.mockResolvedValue(rateLimitResponse);
      mockedUpdateSession.mockResolvedValue(authResponse);
      mockedIsPublicRoute.mockReturnValue(true);

      const result = await middleware(request);

      expect(result?.headers.get("X-RateLimit-Remaining")).toBe("10");
      expect(result?.headers.get("X-RateLimit-Limit")).toBe("100");
    });
  });

  describe("Public Route Handling", () => {
    it("should return early for public routes with session update", async () => {
      mockedIsPublicRoute.mockReturnValue(true);
      const authResponse = NextResponse.next();
      mockedUpdateSession.mockResolvedValue(authResponse);

      const result = await middleware(request);

      expect(mockedIsPublicRoute).toHaveBeenCalledWith("/test");
      expect(mockedUpdateSession).toHaveBeenCalledWith(request);
      expect(result).toBe(authResponse);
    });
  });

  describe("Protected Route Handling", () => {
    it("should handle protected routes normally", async () => {
      mockedIsPublicRoute.mockReturnValue(false);
      const authResponse = NextResponse.next();
      mockedUpdateSession.mockResolvedValue(authResponse);

      const result = await middleware(request);

      expect(mockedUpdateSession).toHaveBeenCalledWith(request);
      expect(result).toBe(authResponse);
    });
  });
});

describe("Route Classification", () => {
  describe("isPublicRoute function", () => {
    beforeEach(() => {
      // Reset mocks to use real implementation
      vi.unmock("../lib/middleware/routes");
      vi.resetModules();
    });

    it("should identify public routes correctly", async () => {
      const { isPublicRoute: realIsPublicRoute } = await import(
        "../lib/middleware/routes"
      );

      expect(realIsPublicRoute("/")).toBe(true);
      expect(realIsPublicRoute("/calories")).toBe(true);
      expect(realIsPublicRoute("/recipe")).toBe(true);
      expect(realIsPublicRoute("/api/health")).toBe(true);
      expect(realIsPublicRoute("/account")).toBe(false);
      expect(realIsPublicRoute("/auth/login")).toBe(false);
    });
  });

  describe("isAuthRoute function", () => {
    it("should identify auth routes correctly", async () => {
      const { isAuthRoute: realIsAuthRoute } = await import(
        "../lib/middleware/routes"
      );

      expect(realIsAuthRoute("/auth/login")).toBe(true);
      expect(realIsAuthRoute("/auth/sign-up")).toBe(true);
      expect(realIsAuthRoute("/auth/forgot-password")).toBe(true);
      expect(realIsAuthRoute("/calories")).toBe(false);
      expect(realIsAuthRoute("/account")).toBe(false);
    });
  });
});
