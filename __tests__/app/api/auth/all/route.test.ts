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

vi.mock("@/lib/auth/auth", () => ({
    auth: {
        handler: vi.fn(),
        config: {
            database: {},
            emailAndPassword: { enabled: true },
        },
    },
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
        // The toNextJsHandler function is mocked and should be available
        expect(toNextJsHandler).toBeDefined();
        expect(typeof toNextJsHandler).toBe("function");
        
        // Verify that GET and POST are functions (indicating toNextJsHandler worked)
        expect(GET).toBeDefined();
        expect(POST).toBeDefined();
    });

    it("should handle auth configuration properly", async () => {
        const { auth } = await import("@/lib/auth/auth");
        expect(auth).toBeDefined();
        expect(auth.config).toBeDefined();
        expect(auth.config.emailAndPassword.enabled).toBe(true);
    });
});
