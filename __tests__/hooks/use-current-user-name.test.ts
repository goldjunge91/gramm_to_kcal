/**
 * Tests for useCurrentUserName hook
 */
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useCurrentUserName } from "@/hooks/use-current-user-name";

// Mock auth client
const mockUseSession = vi.fn();
vi.mock("@/lib/auth/auth-client", () => ({
    useSession: mockUseSession,
}));

describe("useCurrentUserName", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return user name when session exists", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "123",
                    name: "John Doe",
                    email: "john@example.com",
                },
            },
        });

        const { result } = renderHook(() => useCurrentUserName());
        
        expect(result.current).toBe("John Doe");
    });

    it("should return '?' when no session", () => {
        mockUseSession.mockReturnValue({
            data: null,
        });

        const { result } = renderHook(() => useCurrentUserName());
        
        expect(result.current).toBe("?");
    });

    it("should return '?' when session has no user", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: null,
            },
        });

        const { result } = renderHook(() => useCurrentUserName());
        
        expect(result.current).toBe("?");
    });

    it("should return '?' when user has no name", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "123",
                    email: "john@example.com",
                    // no name property
                },
            },
        });

        const { result } = renderHook(() => useCurrentUserName());
        
        expect(result.current).toBe("?");
    });

    it("should return '?' when user name is empty string", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "123",
                    name: "",
                    email: "john@example.com",
                },
            },
        });

        const { result } = renderHook(() => useCurrentUserName());
        
        expect(result.current).toBe("?");
    });

    it("should handle undefined session data", () => {
        mockUseSession.mockReturnValue({
            data: undefined,
        });

        const { result } = renderHook(() => useCurrentUserName());
        
        expect(result.current).toBe("?");
    });

    it("should handle session loading state", () => {
        mockUseSession.mockReturnValue({
            data: null,
            isPending: true,
        });

        const { result } = renderHook(() => useCurrentUserName());
        
        expect(result.current).toBe("?");
    });
});