import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// Mock Next.js functions
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase client
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
};

vi.mock("../lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

// Mock auth rate limiter
const mockAuthRateLimiter = {
  checkRateLimit: vi.fn(),
  resetRateLimit: vi.fn(),
};

vi.mock("../lib/utils/auth-rate-limit", () => ({
  SupabaseAuthRateLimiter: vi
    .fn()
    .mockImplementation(() => mockAuthRateLimiter),
}));

// Mock database functions
vi.mock("../lib/db/users", () => ({
  upsertUser: vi
    .fn()
    .mockResolvedValue({ id: "user-123", email: "test@example.com" }),
  updateUserProfile: vi.fn().mockResolvedValue({ id: "user-123" }),
}));

// Mock auth errors
vi.mock("../lib/utils/auth-errors", () => ({
  getAuthErrorMessage: vi.fn().mockReturnValue("Auth error"),
}));

const mockedRedirect = redirect as Mock;
const mockedRevalidatePath = revalidatePath as Mock;

describe("Auth Actions Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful rate limit check
    mockAuthRateLimiter.checkRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetTime: Date.now() + 60000,
      blocked: false,
    });
  });

  describe("Login Action with Redis Rate Limiting", () => {
    it("should use Redis-based rate limiting instead of in-memory Map", async () => {
      // Import after mocks are set up
      const { loginAction } = await import("../lib/actions/auth");

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      try {
        await loginAction(formData);
      } catch {
        // Expected redirect, ignore
      }

      expect(mockAuthRateLimiter.checkRateLimit).toHaveBeenCalledWith(
        "SIGN_IN",
        "test@example.com",
      );
    });

    it("should redirect when rate limited", async () => {
      const { loginAction } = await import("../lib/actions/auth");

      mockAuthRateLimiter.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        blocked: true,
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      try {
        await loginAction(formData);
      } catch {
        // Expected redirect, ignore
      }

      expect(mockedRedirect).toHaveBeenCalledWith(
        "/auth/login?error=Too many login attempts. Please try again later.",
      );
    });

    it("should clear rate limit on successful login", async () => {
      const { loginAction } = await import("../lib/actions/auth");

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      try {
        await loginAction(formData);
      } catch {
        // Expected redirect, ignore
      }

      expect(mockAuthRateLimiter.resetRateLimit).toHaveBeenCalledWith(
        "SIGN_IN",
        "test@example.com",
      );
    });

    it("should redirect to centralized default path after login", async () => {
      const { loginAction } = await import("../lib/actions/auth");

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      try {
        await loginAction(formData);
      } catch {
        // Expected redirect, ignore
      }

      expect(mockedRedirect).toHaveBeenCalledWith("/calories");
    });
  });

  describe("Signup Action with Redis Rate Limiting", () => {
    it("should use Redis-based rate limiting for signup", async () => {
      const { signupAction } = await import("../lib/actions/auth");

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: "user-123", email: "test@example.com" },
          session: { access_token: "token" },
        },
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password123");

      try {
        await signupAction(formData);
      } catch {
        // Expected redirect, ignore
      }

      expect(mockAuthRateLimiter.checkRateLimit).toHaveBeenCalledWith(
        "SIGN_UP",
        "test@example.com",
      );
    });

    it("should redirect to centralized default path after successful signup", async () => {
      const { signupAction } = await import("../lib/actions/auth");

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: "user-123", email: "test@example.com" },
          session: { access_token: "token" },
        },
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password123");

      try {
        await signupAction(formData);
      } catch {
        // Expected redirect, ignore
      }

      expect(mockedRedirect).toHaveBeenCalledWith("/calories");
    });

    it("should use centralized redirect path in email confirmation", async () => {
      const { signupAction } = await import("../lib/actions/auth");

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password123");

      try {
        await signupAction(formData);
      } catch {
        // Expected redirect, ignore
      }

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            emailRedirectTo: expect.stringContaining("/calories"),
          }),
        }),
      );
    });
  });

  describe("Password Update Action", () => {
    it("should redirect to centralized path after password update", async () => {
      const { updatePasswordAction } = await import("../lib/actions/auth");

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const formData = new FormData();
      formData.append("password", "newpassword123");

      try {
        await updatePasswordAction(formData);
      } catch {
        // Expected redirect, ignore
      }

      expect(mockedRedirect).toHaveBeenCalledWith("/calories");
    });
  });

  describe("Auth Error Handling", () => {
    it("should handle validation errors gracefully", async () => {
      const { loginAction } = await import("../lib/actions/auth");

      const formData = new FormData();
      formData.append("email", "invalid-email");
      formData.append("password", "");

      try {
        await loginAction(formData);
      } catch {
        // Expected redirect, ignore
      }

      expect(mockedRedirect).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login?error="),
      );
    });

    it("should handle Supabase auth errors", async () => {
      const { loginAction } = await import("../lib/actions/auth");

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: "Invalid credentials" },
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "wrongpassword");

      try {
        await loginAction(formData);
      } catch {
        // Expected redirect, ignore
      }

      expect(mockedRedirect).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login?error="),
      );
    });
  });
});
