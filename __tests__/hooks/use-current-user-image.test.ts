/**
 * Tests for useCurrentUserImage hook
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCurrentUserImage } from "@/hooks/use-current-user-image";
import { createMockUser, createMockSession } from "@/__tests__/utils/auth-mocks";

// Mock auth client
vi.mock("@/lib/auth/auth-client", async (importActual) => {
    const actual =
        await importActual<typeof import("@/lib/auth/auth-client")>();
    return {
        ...actual,
        useSession: vi.fn(),
    };
});

describe("useCurrentUserImage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return user image when session exists", async () => {
        const { useSession } = await import("@/lib/auth/auth-client");
        
        vi.mocked(useSession).mockReturnValue({
            data: {
                user: createMockUser({
                    id: "123",
                    name: "John Doe",
                    email: "john@example.com",
                    image: "https://example.com/avatar.jpg",
                }),
                session: createMockSession({ userId: "123" }),
            },
            isPending: false,
            error: null,
            refetch: vi.fn(),
        });

        const { result } = renderHook(() => useCurrentUserImage());

        expect(result.current).toBe("https://example.com/avatar.jpg");
    });

    it("should return null when no session", async () => {
        const { useSession } = await import("@/lib/auth/auth-client");

        vi.mocked(useSession).mockReturnValue({
            data: null,
        });

        const { result } = renderHook(() => useCurrentUserImage());

        expect(result.current).toBeNull();
    });

    it("should return null when session has no user", async () => {
        const { useSession } = await import("@/lib/auth/auth-client");

        vi.mocked(useSession).mockReturnValue({
            data: {
                user: null,
            },
        });

        const { result } = renderHook(() => useCurrentUserImage());

        expect(result.current).toBeNull();
    });

    it("should return null when user has no image", async () => {
        const { useSession } = await import("@/lib/auth/auth-client");

        vi.mocked(useSession).mockReturnValue({
            data: {
                user: {
                    id: "123",
                    name: "John Doe",
                    email: "john@example.com",
                    // no image property
                },
            },
        });

        const { result } = renderHook(() => useCurrentUserImage());

        expect(result.current).toBeNull();
    });

    it("should return null when user image is empty string", async () => {
        const { useSession } = await import("@/lib/auth/auth-client");

        vi.mocked(useSession).mockReturnValue({
            data: {
                user: {
                    id: "123",
                    name: "John Doe",
                    email: "john@example.com",
                    image: "",
                },
            },
        });

        const { result } = renderHook(() => useCurrentUserImage());

        expect(result.current).toBeNull();
    });

    it("should handle undefined session data", async () => {
        const { useSession } = await import("@/lib/auth/auth-client");

        vi.mocked(useSession).mockReturnValue({
            data: undefined,
        });

        const { result } = renderHook(() => useCurrentUserImage());

        expect(result.current).toBeNull();
    });
});
