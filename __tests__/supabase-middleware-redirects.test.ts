import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
const mockCreateServerClient = vi.fn();
const mockIsPublicRoute = vi.fn();
const mockIsAuthRoute = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}));

vi.mock("../lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  },
}));

vi.mock("../lib/middleware/routes", () => ({
  isPublicRoute: mockIsPublicRoute,
  isAuthRoute: mockIsAuthRoute,
  REDIRECT_PATHS: {
    DEFAULT_AFTER_LOGIN: "/calories",
    LOGIN: "/auth/login",
  },
}));

describe("Supabase Middleware Redirects", () => {
  let mockSupabase: any;
  let request: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        getClaims: vi.fn(),
      },
    };

    mockCreateServerClient.mockReturnValue(mockSupabase);

    request = new NextRequest(new URL("http://localhost:3000/test"));

    // Default mocks
    mockIsPublicRoute.mockReturnValue(false);
    mockIsAuthRoute.mockReturnValue(false);
  });

  describe("Authenticated User Redirects", () => {
    beforeEach(() => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: { claims: { sub: "user-123", email: "test@example.com" } },
      });
    });

    it("should redirect authenticated users away from auth pages", async () => {
      mockIsAuthRoute.mockReturnValue(true);
      request = new NextRequest(new URL("http://localhost:3000/auth/login"));

      const { updateSession } = await import("../lib/supabase/middleware");
      const result = await updateSession(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.headers.get("location")).toBe("/calories");
    });

    it("should redirect from signup page to main app", async () => {
      mockIsAuthRoute.mockReturnValue(true);
      request = new NextRequest(new URL("http://localhost:3000/auth/sign-up"));

      const { updateSession } = await import("../lib/supabase/middleware");
      const result = await updateSession(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.headers.get("location")).toBe("/calories");
    });

    it("should redirect from forgot password page", async () => {
      mockIsAuthRoute.mockReturnValue(true);
      request = new NextRequest(
        new URL("http://localhost:3000/auth/forgot-password"),
      );

      const { updateSession } = await import("../lib/supabase/middleware");
      const result = await updateSession(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.headers.get("location")).toBe("/calories");
    });

    it("should allow access to protected routes when authenticated", async () => {
      mockIsPublicRoute.mockReturnValue(false);
      mockIsAuthRoute.mockReturnValue(false);
      request = new NextRequest(new URL("http://localhost:3000/account"));

      const { updateSession } = await import("../lib/supabase/middleware");
      const result = await updateSession(request);

      // Should return the supabase response (NextResponse.next), not a redirect
      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.headers.get("location")).toBeFalsy();
    });

    it("should allow access to public routes when authenticated", async () => {
      mockIsPublicRoute.mockReturnValue(true);
      request = new NextRequest(new URL("http://localhost:3000/calories"));

      const { updateSession } = await import("../lib/supabase/middleware");
      const result = await updateSession(request);

      // Should return the supabase response, not a redirect
      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.headers.get("location")).toBeFalsy();
    });
  });

  describe("Unauthenticated User Redirects", () => {
    beforeEach(() => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: { claims: null },
      });
    });

    it("should redirect unauthenticated users from protected routes to login", async () => {
      mockIsPublicRoute.mockReturnValue(false);
      mockIsAuthRoute.mockReturnValue(false);
      request = new NextRequest(new URL("http://localhost:3000/account"));

      const { updateSession } = await import("../lib/supabase/middleware");
      const result = await updateSession(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.headers.get("location")).toBe("/auth/login");
    });

    it("should allow access to public routes when unauthenticated", async () => {
      mockIsPublicRoute.mockReturnValue(true);
      request = new NextRequest(new URL("http://localhost:3000/calories"));

      const { updateSession } = await import("../lib/supabase/middleware");
      const result = await updateSession(request);

      // Should return the supabase response, not a redirect
      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.headers.get("location")).toBeFalsy();
    });

    it("should allow access to auth pages when unauthenticated", async () => {
      mockIsAuthRoute.mockReturnValue(true);
      mockIsPublicRoute.mockReturnValue(false);
      request = new NextRequest(new URL("http://localhost:3000/auth/login"));

      const { updateSession } = await import("../lib/supabase/middleware");
      const result = await updateSession(request);

      // Should return the supabase response, not a redirect
      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.headers.get("location")).toBeFalsy();
    });
  });

  describe("Session Management", () => {
    it("should call getClaims for session validation", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: { claims: null },
      });

      const { updateSession } = await import("../lib/supabase/middleware");
      await updateSession(request);

      expect(mockSupabase.auth.getClaims).toHaveBeenCalledTimes(1);
    });

    it("should create Supabase client with correct configuration", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: { claims: null },
      });

      const { updateSession } = await import("../lib/supabase/middleware");
      await updateSession(request);

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        "http://localhost:54321",
        "test-anon-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        }),
      );
    });
  });

  describe("Cookie Management", () => {
    it("should handle cookie setting correctly", async () => {
      const mockCookies = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      };

      Object.defineProperty(request, "cookies", {
        value: mockCookies,
        writable: true,
      });

      mockSupabase.auth.getClaims.mockResolvedValue({
        data: { claims: null },
      });

      const { updateSession } = await import("../lib/supabase/middleware");
      await updateSession(request);

      // Verify cookie handling functions were called during client creation
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        "http://localhost:54321",
        "test-anon-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        }),
      );
    });
  });
});
