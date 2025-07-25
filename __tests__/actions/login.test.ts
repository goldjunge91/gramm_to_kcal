/**
 * Tests for login action
 */
import { logger } from "better-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/lib/auth/auth", () => ({
    auth: {
        api: {
            signInEmail: vi.fn(),
        },
    },
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    redirect: vi.fn().mockImplementation((url) => {
        throw new Error(`REDIRECT: ${url}`);
    }),
}));

vi.mock("@/lib/auth/routes", () => ({
    REDIRECT_PATHS: {
        DEFAULT_AFTER_LOGIN: "/",
    },
}));

describe("login action", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock console.log for audit logging
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    it("should validate email and password requirements", async () => {
        // Import the action to test
        const { loginAction } = await import("@/actions/login");

        const formData = new FormData();
        formData.append("email", "");
        formData.append("password", "");

        // Action redirects on validation failure - empty email triggers "Invalid email address"
        await expect(loginAction(formData)).rejects.toThrow(
            "REDIRECT: /auth/login?error=Invalid%20email%20address",
        );
    });

    it("should validate email format", async () => {
        const { loginAction } = await import("@/actions/login");

        const formData = new FormData();
        formData.append("email", "invalid-email");
        formData.append("password", "password123");

        // Action redirects on validation failure
        await expect(loginAction(formData)).rejects.toThrow(
            "REDIRECT: /auth/login?error=Invalid%20email%20address",
        );
    });

    it("should handle successful login", async () => {
        const { auth } = await import("@/lib/auth/auth");
        const { loginAction } = await import("@/actions/login");

        vi.mocked(auth.api.signInEmail).mockResolvedValue({
            user: {
                id: "123",
                email: "test@example.com",
                name: "",
                image: undefined,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            redirect: false,
            token: "",
            url: undefined,
        });

        const formData = new FormData();
        formData.append("email", "test@example.com");
        formData.append("password", "password123");

        // Should redirect to home page on success
        await expect(loginAction(formData)).rejects.toThrow("REDIRECT: /");

        expect(auth.api.signInEmail).toHaveBeenCalledWith({
            body: {
                email: "test@example.com",
                password: "password123",
            },
        });
    });

    it("should handle login errors", async () => {
        const { auth } = await import("@/lib/auth/auth");
        const { loginAction } = await import("@/actions/login");

        // Better Auth might throw an error instead of returning {user: null}
        vi.mocked(auth.api.signInEmail).mockRejectedValue(
            new Error("Invalid credentials"),
        );

        const formData = new FormData();
        formData.append("email", "test@example.com");
        formData.append("password", "wrongpassword");

        // Should redirect with generic error message when exception is thrown
        await expect(loginAction(formData)).rejects.toThrow(
            "REDIRECT: /auth/login?error=Login%20failed.%20Please%20try%20again.",
        );
    });

    it("should log authentication attempts", async () => {
        const { auth } = await import("@/lib/auth/auth");
        const { loginAction } = await import("@/actions/login");
        const consoleSpy = vi.spyOn(console, "log");

        vi.mocked(auth.api.signInEmail).mockResolvedValue({
            user: {
                id: "123",
                email: "test@example.com",
                name: "",
                image: undefined,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            redirect: false,
            token: "",
            url: undefined,
        });

        const formData = new FormData();
        formData.append("email", "test@example.com");
        formData.append("password", "password123");

        try {
            await loginAction(formData);
        }
        // catch (_error) {
        //     // Expected redirect error
        // }
        catch (error) {
            // next/navigation redirect throws an error
            logger.error("Unexpected error during signup", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                "[BETTER_AUTH] SIGNIN - test@example.com - SUCCESS",
            ),
        );

        consoleSpy.mockRestore();
    });
});
