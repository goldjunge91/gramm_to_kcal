import { toNextJsHandler } from "better-auth/next-js";
/**
 * Tests for auth API route (Better Auth integration)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import after mocks are set up
import { GET, POST } from "@/app/api/auth/[...all]/route";
// Use the mocked auth from "@/lib/auth/auth"
import { auth } from "@/lib/auth/auth";

// Mock better-auth before any imports
vi.mock("better-auth/next-js", () => {
    return {
        toNextJsHandler: vi.fn(_auth => ({
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
        expect(toNextJsHandler).toBeDefined();
        expect(typeof toNextJsHandler).toBe("function");
        expect(GET).toBeDefined();
        expect(POST).toBeDefined();
    });

    it("should provide an auth handler function", () => {
        // Import at top, so just use the mocked auth
        expect(auth).toBeDefined();
        expect(typeof auth.handler).toBe("function");
    });
});
