/**
 * Tests for auth client configuration
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock better-auth/react
vi.mock("better-auth/react", () => ({
    createAuthClient: vi.fn(() => ({
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        useSession: vi.fn(),
        getSession: vi.fn(),
    })),
}));

vi.mock("../../../lib/env", () => ({
    env: {
        NEXT_PUBLIC_URL: "http://localhost:3000",
    },
}));

describe("auth-client", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should create auth client with correct baseURL", async () => {
        const { createAuthClient } = await import("better-auth/react");

        // Import to trigger the creation
        await import("@/lib/auth/auth-client");

        expect(createAuthClient).toHaveBeenCalledWith({
            baseURL: "http://localhost:3000/api/auth",
        });
    });

    it("should export auth methods", async () => {
        const authClient = await import("@/lib/auth/auth-client");

        expect(authClient.signIn).toBeDefined();
        expect(authClient.signUp).toBeDefined();
        expect(authClient.signOut).toBeDefined();
        expect(authClient.useSession).toBeDefined();
        expect(authClient.getSession).toBeDefined();
        expect(authClient.authClient).toBeDefined();
    });

    it("should handle different environment URLs", async () => {
        // Reset modules to test with different env
        vi.resetModules();

        vi.doMock("../../../lib/env", () => ({
            env: {
                NEXT_PUBLIC_URL: "https://example.com",
            },
        }));

        const { createAuthClient } = await import("better-auth/react");

        await import("@/lib/auth/auth-client");

        expect(createAuthClient).toHaveBeenCalledWith({
            baseURL: "https://example.com/api/auth",
        });
    });
});
