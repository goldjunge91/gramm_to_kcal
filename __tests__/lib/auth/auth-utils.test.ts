/**
 * Tests for auth utilities (server-side auth helpers)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    currentSessionUser,
    requireAuth,
    requireRole,
    sessionHasRole,
} from "@/lib/auth/auth-utils";

// Mock auth module
vi.mock("@/lib/auth/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}));

describe("auth-utils", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("currentSessionUser", () => {
        it("should return user when session exists", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const mockUser = {
                id: "user123",
                email: "test@example.com",
                emailVerified: true,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                image: null,
                banned: null,
                banReason: null,
                banExpires: null,
                role: null,
                isAnonymous: null,
            };

            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: {
                    id: "session123",
                    expiresAt: new Date(),
                    token: "token123",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ipAddress: null,
                    userAgent: null,
                    userId: "user123",
                    impersonatedBy: null,
                },
            });

            const result = await currentSessionUser();

            expect(result).toEqual(mockUser);
        });

        it("should return null when no session", async () => {
            const { auth } = await import("@/lib/auth/auth");

            vi.mocked(auth.api.getSession).mockResolvedValue(null);

            const result = await currentSessionUser();

            expect(result).toBeNull();
        });

        it("should return null when session has no user", async () => {
            const { auth } = await import("@/lib/auth/auth");

            vi.mocked(auth.api.getSession).mockResolvedValue({
                // @ts-ignore
                user: null,
                session: {
                    id: "session123",
                    expiresAt: new Date(),
                    token: "token123",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ipAddress: null,
                    userAgent: null,
                    userId: "user123",
                    impersonatedBy: null,
                },
            });

            const result = await currentSessionUser();

            expect(result).toBeNull();
        });

        it("should handle errors gracefully", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            vi.mocked(auth.api.getSession).mockRejectedValue(
                new Error("Session error"),
            );

            const result = await currentSessionUser();

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error getting current session user:",
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });
    });

    describe("sessionHasRole", () => {
        it("should return true when user has the role", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const mockUser = {
                id: "user123",
                email: "test@example.com",
                emailVerified: true,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                image: null,
                banned: null,
                banReason: null,
                banExpires: null,
                role: "admin",
                isAnonymous: null,
            };

            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: {
                    id: "session123",
                    expiresAt: new Date(),
                    token: "token123",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ipAddress: null,
                    userAgent: null,
                    userId: "user123",
                    impersonatedBy: null,
                },
            });

            const result = await sessionHasRole("admin");

            expect(result).toBe(true);
        });

        it("should return false when user has different role", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const mockUser = {
                id: "user123",
                email: "test@example.com",
                emailVerified: true,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                image: null,
                banned: null,
                banReason: null,
                banExpires: null,
                role: "user",
                isAnonymous: null,
            };

            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: {
                    id: "session123",
                    expiresAt: new Date(),
                    token: "token123",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ipAddress: null,
                    userAgent: null,
                    userId: "user123",
                    impersonatedBy: null,
                },
            });

            const result = await sessionHasRole("admin");

            expect(result).toBe(false);
        });

        it("should return false when no session", async () => {
            const { auth } = await import("@/lib/auth/auth");

            vi.mocked(auth.api.getSession).mockResolvedValue(null);

            const result = await sessionHasRole("admin");

            expect(result).toBe(false);
        });

        it("should handle errors gracefully", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            vi.mocked(auth.api.getSession).mockRejectedValue(
                new Error("Role check error"),
            );

            const result = await sessionHasRole("admin");

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error checking user role:",
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });
    });

    describe("requireAuth", () => {
        it("should return user when authenticated", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const mockUser = {
                id: "user123",
                email: "test@example.com",
                emailVerified: true,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                image: null,
                banned: null,
                banReason: null,
                banExpires: null,
                role: null,
                isAnonymous: null,
            };

            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: {
                    id: "session123",
                    expiresAt: new Date(),
                    token: "token123",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ipAddress: null,
                    userAgent: null,
                    userId: "user123",
                    impersonatedBy: null,
                },
            });

            const result = await requireAuth();

            expect(result).toEqual(mockUser);
        });

        it("should throw error when not authenticated", async () => {
            const { auth } = await import("@/lib/auth/auth");

            vi.mocked(auth.api.getSession).mockResolvedValue(null);

            await expect(requireAuth()).rejects.toThrow(
                "Authentication required",
            );
        });

        it("should throw error when session has no user", async () => {
            const { auth } = await import("@/lib/auth/auth");

            vi.mocked(auth.api.getSession).mockResolvedValue({
                // @ts-ignore
                user: null,
                session: {
                    id: "session123",
                    expiresAt: new Date(),
                    token: "token123",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ipAddress: null,
                    userAgent: null,
                    userId: "user123",
                    impersonatedBy: null,
                },
            });

            await expect(requireAuth()).rejects.toThrow(
                "Authentication required",
            );
        });
    });

    describe("requireRole", () => {
        it("should return user when has required role", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const mockUser = {
                id: "user123",
                email: "test@example.com",
                emailVerified: true,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                image: null,
                banned: null,
                banReason: null,
                banExpires: null,
                role: "admin",
                isAnonymous: null,
            };

            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: {
                    id: "session123",
                    expiresAt: new Date(),
                    token: "token123",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ipAddress: null,
                    userAgent: null,
                    userId: "user123",
                    impersonatedBy: null,
                },
            });

            const result = await requireRole("admin");

            expect(result).toEqual(mockUser);
        });

        it("should throw error when user doesn't have required role", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const mockUser = {
                id: "user123",
                email: "test@example.com",
                emailVerified: true,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                image: null,
                banned: null,
                banReason: null,
                banExpires: null,
                role: "user",
                isAnonymous: null,
            };

            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: {
                    id: "session123",
                    expiresAt: new Date(),
                    token: "token123",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ipAddress: null,
                    userAgent: null,
                    userId: "user123",
                    impersonatedBy: null,
                },
            });

            await expect(requireRole("admin")).rejects.toThrow(
                "Role 'admin' required",
            );
        });

        it("should throw authentication error when not authenticated", async () => {
            const { auth } = await import("@/lib/auth/auth");

            vi.mocked(auth.api.getSession).mockResolvedValue(null);

            await expect(requireRole("admin")).rejects.toThrow(
                "Authentication required",
            );
        });

        it("should call requireAuth first", async () => {
            const { auth } = await import("@/lib/auth/auth");

            vi.mocked(auth.api.getSession).mockResolvedValue(null);

            try {
                await requireRole("admin");
            }
            catch (error) {
                expect((error as Error).message).toBe(
                    "Authentication required",
                );
            }
        });
    });
});
