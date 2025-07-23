/**
 * Tests for auth API route (Better Auth integration)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock better-auth before any imports
vi.mock("better-auth/next-js", () => {
    return {
        toNextJsHandler: vi.fn((auth) => ({
            GET: vi.fn(),
            POST: vi.fn(),
        })),
    };
});

const mockAuth = {
    handler: vi.fn(),
    config: {
        database: {},
        emailAndPassword: { enabled: true },
    },
};

vi.mock("@/lib/auth/auth", () => ({
    auth: mockAuth,
}));

// Import after mocks are set up
import { GET, POST } from "@/app/api/auth/[...all]/route";
import { toNextJsHandler } from "better-auth/next-js";

describe("/api/auth/[...all]", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should export GET and POST handlers", () => {
        expect(GET).toBeDefined();
        expect(POST).toBeDefined();
        expect(typeof GET).toBe("function");
        expect(typeof POST).toBe("function");
    });

    it("should use toNextJsHandler from better-auth", () => {
        // The call happens during module initialization
        expect(toNextJsHandler).toHaveBeenCalledWith(mockAuth);
    });
    

    it("should handle auth configuration properly", () => {
        expect(mockAuth).toBeDefined();
        expect(mockAuth.config).toBeDefined();
        expect(mockAuth.config.emailAndPassword.enabled).toBe(true);
    });
});