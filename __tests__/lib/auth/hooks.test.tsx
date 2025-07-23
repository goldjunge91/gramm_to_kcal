/**
 * Tests for auth hooks (client-side auth helpers)
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    useAuth,
    useCurrentSession,
    useCurrentUser,
    useRole
} from "../../../lib/auth/hooks";

// Mock auth client
vi.mock("@/lib/auth/auth-client", () => ({
    useSession: vi.fn(),
}));

describe("auth hooks", () => {
    // Mock Session Objekt für alle Tests
    const mockSession = {
        id: "sess-1",
        userId: "123",
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        token: "token",
        ipAddress: null,
        userAgent: null,
    };
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("useCurrentSession", () => {
        it("should return session data from useSession", async () => {
            const { useSession } = await import("@/lib/auth/auth-client");
            const mockSessionData = { 
                data: {
                    user: {
                        id: "123",
                        email: "test@example.com",
                        emailVerified: false,
                        name: "Test User",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        image: null
                    },
                    session: mockSession
                },
                isPending: false,
                error: null,
                refetch: vi.fn()
            };
            vi.mocked(useSession).mockReturnValue(mockSessionData);

            const { result } = renderHook(() => useCurrentSession());

            expect(result.current).toEqual(mockSessionData);
            expect(useSession).toHaveBeenCalled();
        });
    });

    describe("useCurrentUser", () => {
        it("should return user when session exists", async () => {
            const { useSession } = await import("@/lib/auth/auth-client");
            const mockUser = { 
                id: "123",
                email: "test@example.com",
                emailVerified: false,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                image: null
            };
            vi.mocked(useSession).mockReturnValue({
                data: { user: mockUser, session: mockSession },
                isPending: false,
                error: null,
                refetch: vi.fn()
            });

            const { result } = renderHook(() => useCurrentUser());

            expect(result.current).toEqual(mockUser);
        });

        it("should return null when no session", async () => {
            const { useSession } = await import("@/lib/auth/auth-client");
            vi.mocked(useSession).mockReturnValue({
                data: null,
                isPending: false,
                error: null,
                refetch: vi.fn()
            });

            const { result } = renderHook(() => useCurrentUser());

            expect(result.current).toBeNull();
        });

        it("should return null when session has no user", async () => {
            const { useSession } = await import("@/lib/auth/auth-client");
            vi.mocked(useSession).mockReturnValue({
                data: null,
                isPending: false,
                error: null,
                refetch: vi.fn()
            });

            const { result } = renderHook(() => useCurrentUser());

            expect(result.current).toBeNull();
        });
    });

    describe("useAuth", () => {
        it("should return authenticated status when user exists", async () => {
            const { useSession } = await import("@/lib/auth/auth-client");
            const mockUser = { id: "123", email: "test@example.com", emailVerified: false, name: "Test User", createdAt: new Date(), updatedAt: new Date(), image: null };
            vi.mocked(useSession).mockReturnValue({
                data: { user: mockUser, session: mockSession },
                isPending: false,
                error: null,
                refetch: vi.fn()
            });

            const { result } = renderHook(() => useAuth());

            expect(result.current).toEqual({
                isAuthenticated: true,
                isLoading: false,
                user: mockUser,
            });
        });

        it("should return not authenticated when no user", async () => {
            const { useSession } = await import("@/lib/auth/auth-client");
            vi.mocked(useSession).mockReturnValue({
                data: null,
                isPending: false,
                error: null,
                refetch: vi.fn()
            });

            const { result } = renderHook(() => useAuth());

            expect(result.current).toEqual({
                isAuthenticated: false,
                isLoading: false,
                user: null,
            });
        });

        it("should return loading state when session is pending", async () => {
            const { useSession } = await import("@/lib/auth/auth-client");
            vi.mocked(useSession).mockReturnValue({
                data: null,
                isPending: true,
                error: null,
                refetch: vi.fn()
            });

            const { result } = renderHook(() => useAuth());

            expect(result.current).toEqual({
                isAuthenticated: false,
                isLoading: true,
                user: null,
            });
        });
    });

    describe("useRole", () => {
        it("should return true when user has the role", async () => {
            const { useSession } = await import("@/lib/auth/auth-client");
            const mockUser = { id: "123", email: "test@example.com", role: "admin", emailVerified: false, name: "Test User", createdAt: new Date(), updatedAt: new Date(), image: null };
            vi.mocked(useSession).mockReturnValue({
                data: { user: mockUser, session: mockSession },
                isPending: false,
                error: null,
                refetch: vi.fn()
            });

            const { result } = renderHook(() => useRole("admin"));

            expect(result.current).toEqual({
                hasRole: true,
                isLoading: false,
                userRole: "admin",
            });
        });

        it("should return false when user has different role", async () => {
            const { useSession } = await import("@/lib/auth/auth-client");
            const mockUser = { id: "123", email: "test@example.com", role: "user", emailVerified: false, name: "Test User", createdAt: new Date(), updatedAt: new Date(), image: null };
            vi.mocked(useSession).mockReturnValue({
                data: { user: mockUser, session: mockSession },
                isPending: false,
                error: null,
                refetch: vi.fn()
            });

            const { result } = renderHook(() => useRole("admin"));

            expect(result.current).toEqual({
                hasRole: false,
                isLoading: false,
                userRole: "user",
            });
        });

        it("should return false when no user", async () => {
            const { useSession } = await import("@/lib/auth/auth-client");
            vi.mocked(useSession).mockReturnValue({
                data: null,
                isPending: false,
                error: null,
                refetch: vi.fn()
            });

            const { result } = renderHook(() => useRole("admin"));

            expect(result.current).toEqual({
                hasRole: false,
                isLoading: false,
                userRole: undefined,
            });
        });

        it("should handle loading state", async () => {
            const { useSession } = await import("@/lib/auth/auth-client");
            vi.mocked(useSession).mockReturnValue({
                data: null,
                isPending: true,
                error: null,
                refetch: vi.fn()
            });

            const { result } = renderHook(() => useRole("admin"));

            expect(result.current).toEqual({
                hasRole: false,
                isLoading: true,
                userRole: undefined,
            });
        });

        it("should handle user without role property", () => {
            // ...existing code...
        });

        it("should handle user without role property async", async () => {
            const { useSession } = await import("@/lib/auth/auth-client");
            // ...existing code...
            const mockUser = { id: "123", email: "test@example.com", emailVerified: false, name: "Test User", createdAt: new Date(), updatedAt: new Date(), image: null };
            vi.mocked(useSession).mockReturnValue({
                data: { user: mockUser, session: mockSession },
                isPending: false,
                error: null,
                refetch: vi.fn()
            });

            const { result } = renderHook(() => useRole("admin"));

            expect(result.current).toEqual({
                hasRole: false,
                isLoading: false,
                userRole: undefined,
            });
        });
    });
});