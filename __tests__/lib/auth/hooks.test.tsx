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
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("useCurrentSession", () => {
        it("should return session data from useSession", () => {
            const { useSession } = require("@/lib/auth/auth-client");
            const mockSessionData = { 
                data: { user: { id: "123", email: "test@example.com" } },
                isPending: false 
            };
            
            useSession.mockReturnValue(mockSessionData);

            const { result } = renderHook(() => useCurrentSession());
            
            expect(result.current).toEqual(mockSessionData);
            expect(useSession).toHaveBeenCalled();
        });
    });

    describe("useCurrentUser", () => {
        it("should return user when session exists", () => {
            const { useSession } = require("@/lib/auth/auth-client");
            const mockUser = { id: "123", email: "test@example.com" };
            
            useSession.mockReturnValue({
                data: { user: mockUser },
                isPending: false
            });

            const { result } = renderHook(() => useCurrentUser());
            
            expect(result.current).toEqual(mockUser);
        });

        it("should return null when no session", () => {
            const { useSession } = require("@/lib/auth/auth-client");
            
            useSession.mockReturnValue({
                data: null,
                isPending: false
            });

            const { result } = renderHook(() => useCurrentUser());
            
            expect(result.current).toBeNull();
        });

        it("should return null when session has no user", () => {
            const { useSession } = require("@/lib/auth/auth-client");
            
            useSession.mockReturnValue({
                data: { user: null },
                isPending: false
            });

            const { result } = renderHook(() => useCurrentUser());
            
            expect(result.current).toBeNull();
        });
    });

    describe("useAuth", () => {
        it("should return authenticated status when user exists", () => {
            const { useSession } = require("@/lib/auth/auth-client");
            const mockUser = { id: "123", email: "test@example.com" };
            
            useSession.mockReturnValue({
                data: { user: mockUser },
                isPending: false
            });

            const { result } = renderHook(() => useAuth());
            
            expect(result.current).toEqual({
                isAuthenticated: true,
                isLoading: false,
                user: mockUser,
            });
        });

        it("should return not authenticated when no user", () => {
            const { useSession } = require("@/lib/auth/auth-client");
            
            useSession.mockReturnValue({
                data: null,
                isPending: false
            });

            const { result } = renderHook(() => useAuth());
            
            expect(result.current).toEqual({
                isAuthenticated: false,
                isLoading: false,
                user: null,
            });
        });

        it("should return loading state when session is pending", () => {
            const { useSession } = require("@/lib/auth/auth-client");
            
            useSession.mockReturnValue({
                data: null,
                isPending: true
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
        it("should return true when user has the role", () => {
            const { useSession } = require("@/lib/auth/auth-client");
            const mockUser = { id: "123", email: "test@example.com", role: "admin" };
            
            useSession.mockReturnValue({
                data: { user: mockUser },
                isPending: false
            });

            const { result } = renderHook(() => useRole("admin"));
            
            expect(result.current).toEqual({
                hasRole: true,
                isLoading: false,
                userRole: "admin",
            });
        });

        it("should return false when user has different role", () => {
            const { useSession } = require("@/lib/auth/auth-client");
            const mockUser = { id: "123", email: "test@example.com", role: "user" };
            
            useSession.mockReturnValue({
                data: { user: mockUser },
                isPending: false
            });

            const { result } = renderHook(() => useRole("admin"));
            
            expect(result.current).toEqual({
                hasRole: false,
                isLoading: false,
                userRole: "user",
            });
        });

        it("should return false when no user", () => {
            const { useSession } = require("@/lib/auth/auth-client");
            
            useSession.mockReturnValue({
                data: null,
                isPending: false
            });

            const { result } = renderHook(() => useRole("admin"));
            
            expect(result.current).toEqual({
                hasRole: false,
                isLoading: false,
                userRole: undefined,
            });
        });

        it("should handle loading state", () => {
            const { useSession } = require("@/lib/auth/auth-client");
            
            useSession.mockReturnValue({
                data: null,
                isPending: true
            });

            const { result } = renderHook(() => useRole("admin"));
            
            expect(result.current).toEqual({
                hasRole: false,
                isLoading: true,
                userRole: undefined,
            });
        });

        it("should handle user without role property", () => {
            const { useSession } = require("@/lib/auth/auth-client");
            const mockUser = { id: "123", email: "test@example.com" }; // No role property
            
            useSession.mockReturnValue({
                data: { user: mockUser },
                isPending: false
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