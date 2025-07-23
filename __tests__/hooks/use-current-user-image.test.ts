/**
 * Tests for useCurrentUserImage hook
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCurrentUserImage } from "@/hooks/use-current-user-image";

// Mock auth client
const mockUseSession = vi.fn();
vi.mock("@/lib/auth/auth-client", async (importActual) => {
    const actual =
        await importActual<typeof import("@/lib/auth/auth-client")>();
    return {
        ...actual,
        useSession: mockUseSession,
    };
});

describe("useCurrentUserImage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return user image when session exists", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "123",
                    name: "John Doe",
                    email: "john@example.com",
                    image: "https://example.com/avatar.jpg",
                },
            },
        });

        const { result } = renderHook(() => useCurrentUserImage());

        expect(result.current).toBe("https://example.com/avatar.jpg");
    });

    it("should return null when no session", () => {
        mockUseSession;

        mockUseSession.mockReturnValue({
            data: null,
        });

        const { result } = renderHook(() => useCurrentUserImage());

        expect(result.current).toBeNull();
    });

    it("should return null when session has no user", () => {
        mockUseSession;

        mockUseSession.mockReturnValue({
            data: {
                user: null,
            },
        });

        const { result } = renderHook(() => useCurrentUserImage());

        expect(result.current).toBeNull();
    });

    it("should return null when user has no image", () => {
        mockUseSession;

        mockUseSession.mockReturnValue({
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

    it("should return null when user image is empty string", () => {
        mockUseSession;

        mockUseSession.mockReturnValue({
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

    it("should handle undefined session data", () => {
        mockUseSession;

        mockUseSession.mockReturnValue({
            data: undefined,
        });

        const { result } = renderHook(() => useCurrentUserImage());

        expect(result.current).toBeNull();
    });
});
