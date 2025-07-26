/**
 * Tests for Admin Authorization utilities
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ADMIN_ROLES, logAdminAction, verifyAdminAccess, withAdminAuth } from "@/lib/auth/admin-auth";

// Mock Better Auth
vi.mock("@/lib/auth/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}));

vi.mock("next/headers", () => ({
    headers: vi.fn(() => Promise.resolve(new Headers())),
}));

describe("admin Authorization", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("verifyAdminAccess", () => {
        it("should authorize user with admin role", async () => {
            const mockSession = {
                session: {
                    id: "session-1",
                    userId: "admin-123",
                    expiresAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    token: "mock-token",
                    ipAddress: "127.0.0.1",
                    userAgent: "test-agent",
                    impersonatedBy: null,
                    revokedAt: null,
                },
                user: {
                    id: "admin-123",
                    email: "admin@example.com",
                    emailVerified: true,
                    name: "Admin User",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    image: null,
                    banned: false,
                    role: "admin",
                    banReason: null,
                    banExpires: null,
                    isAnonymous: false,
                },
            };

            const { auth } = await import("@/lib/auth/auth");
            vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

            const request = new NextRequest("http://localhost:3000/api/admin/test");
            const result = await verifyAdminAccess(request);

            expect(result.authorized).toBe(true);
            expect(result.user).toEqual({
                id: "admin-123",
                email: "admin@example.com",
                role: "admin",
            });
            expect(result.correlationId).toBeDefined();
        });

        it("should authorize user with super_admin role", async () => {
            const mockSession = {
                session: {
                    id: "session-2",
                    userId: "super-123",
                    expiresAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    token: "mock-token-super",
                    ipAddress: "127.0.0.1",
                    userAgent: "test-agent",
                    impersonatedBy: null,
                    revokedAt: null,
                },
                user: {
                    id: "super-123",
                    email: "super@example.com",
                    emailVerified: true,
                    name: "Super Admin",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    image: null,
                    banned: false,
                    role: "super_admin",
                    banReason: null,
                    banExpires: null,
                    isAnonymous: false,
                },
            };

            const { auth } = await import("@/lib/auth/auth");
            // @ts-ignore
            // @ts-ignore
            vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

            const request = new NextRequest("http://localhost:3000/api/admin/test");
            const result = await verifyAdminAccess(request);

            expect(result.authorized).toBe(true);
            expect(result.user?.role).toBe("super_admin");
        });

        it("should reject user without session", async () => {
            const { auth } = await import("@/lib/auth/auth");
            vi.mocked(auth.api.getSession).mockResolvedValue(null);

            const request = new NextRequest("http://localhost:3000/api/admin/test");
            const result = await verifyAdminAccess(request);

            expect(result.authorized).toBe(false);
            expect(result.error).toBe("No active session");
            expect(result.correlationId).toBeDefined();
        });

        it("should reject user without admin role", async () => {
            const mockSession = {
                session: {
                    id: "session-3",
                    userId: "user-123",
                    expiresAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    token: "mock-token-user",
                    ipAddress: "127.0.0.1",
                    userAgent: "test-agent",
                    impersonatedBy: null,
                    revokedAt: null,
                },
                user: {
                    id: "user-123",
                    email: "user@example.com",
                    emailVerified: true,
                    name: "Normal User",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    image: null,
                    banned: false,
                    role: "user",
                    banReason: null,
                    banExpires: null,
                    isAnonymous: false,
                },
            };

            const { auth } = await import("@/lib/auth/auth");
            // @ts-ignore
            vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

            const request = new NextRequest("http://localhost:3000/api/admin/test");
            const result = await verifyAdminAccess(request);

            expect(result.authorized).toBe(false);
            expect(result.error).toContain("Insufficient privileges");
            expect(result.correlationId).toBeDefined();
        });

        it("should reject user with no role", async () => {
            const mockSession = {
                session: {
                    id: "session-4",
                    userId: "user-123",
                    expiresAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    token: "mock-token-norole",
                    ipAddress: "127.0.0.1",
                    userAgent: "test-agent",
                    impersonatedBy: null,
                    revokedAt: null,
                },
                user: {
                    id: "user-123",
                    email: "user@example.com",
                    emailVerified: true,
                    name: "No Role User",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    image: null,
                    banned: false,
                    role: null,
                    banReason: null,
                    banExpires: null,
                    isAnonymous: false,
                },
            };

            const { auth } = await import("@/lib/auth/auth");
            // @ts-ignore
            vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

            const request = new NextRequest("http://localhost:3000/api/admin/test");
            const result = await verifyAdminAccess(request);

            expect(result.authorized).toBe(false);
            expect(result.error).toContain("Insufficient privileges");
        });

        it("should handle session check errors", async () => {
            const { auth } = await import("@/lib/auth/auth");
            vi.mocked(auth.api.getSession).mockRejectedValue(new Error("Session error"));

            const request = new NextRequest("http://localhost:3000/api/admin/test");
            const result = await verifyAdminAccess(request);

            expect(result.authorized).toBe(false);
            expect(result.error).toBe("Authorization check failed");
            expect(result.correlationId).toBeDefined();
        });
    });

    describe("withAdminAuth middleware", () => {
        it("should call handler when user is authorized", async () => {
            const mockSession = {
                session: {
                    id: "session-5",
                    userId: "admin-123",
                    expiresAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    token: "mock-token-admin",
                    ipAddress: "127.0.0.1",
                    userAgent: "test-agent",
                    impersonatedBy: null,
                    revokedAt: null,
                },
                user: {
                    id: "admin-123",
                    email: "admin@example.com",
                    emailVerified: true,
                    name: "Admin User",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    image: null,
                    banned: false,
                    role: "admin",
                    banReason: null,
                    banExpires: null,
                    isAnonymous: false,
                },
            };

            const { auth } = await import("@/lib/auth/auth");
            // @ts-ignore
            // @ts-ignore
            vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

            const mockHandler = vi.fn().mockResolvedValue(new Response("Success"));
            const wrappedHandler = withAdminAuth(mockHandler);

            const request = new NextRequest("http://localhost:3000/api/admin/test");
            await wrappedHandler(request);

            expect(mockHandler).toHaveBeenCalled();
            expect(mockHandler).toHaveBeenCalledWith(
                request,
                expect.objectContaining({
                    authorized: true,
                    user: expect.objectContaining({
                        id: "admin-123",
                        email: "admin@example.com",
                        role: "admin",
                    }),
                }),
            );
        });

        it("should return 403 when user is not authorized", async () => {
            const { auth } = await import("@/lib/auth/auth");
            vi.mocked(auth.api.getSession).mockResolvedValue(null);

            const mockHandler = vi.fn();
            const wrappedHandler = withAdminAuth(mockHandler);

            const request = new NextRequest("http://localhost:3000/api/admin/test");
            const response = await wrappedHandler(request);

            expect(mockHandler).not.toHaveBeenCalled();
            expect(response.status).toBe(403);

            const data = await response.json();
            expect(data.error).toBe("Forbidden");
            expect(data.correlationId).toBeDefined();
        });

        it("should return 403 when user has insufficient privileges", async () => {
            const mockSession = {
                session: {
                    id: "session-6",
                    userId: "user-123",
                    expiresAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    token: "mock-token-user2",
                    ipAddress: "127.0.0.1",
                    userAgent: "test-agent",
                    impersonatedBy: null,
                    revokedAt: null,
                },
                user: {
                    id: "user-123",
                    email: "user@example.com",
                    emailVerified: true,
                    name: "Normal User",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    image: null,
                    banned: false,
                    role: "user",
                    banReason: null,
                    banExpires: null,
                    isAnonymous: false,
                },
            };

            const { auth } = await import("@/lib/auth/auth");
            // @ts-ignore
            vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

            const mockHandler = vi.fn();
            const wrappedHandler = withAdminAuth(mockHandler);

            const request = new NextRequest("http://localhost:3000/api/admin/test");
            const response = await wrappedHandler(request);

            expect(mockHandler).not.toHaveBeenCalled();
            expect(response.status).toBe(403);

            const data = await response.json();
            expect(data.error).toBe("Forbidden");
            expect(data.message).toContain("Insufficient privileges");
        });
    });

    describe("logAdminAction", () => {
        it("should log admin action with all details", () => {
            const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

            const authResult = {
                authorized: true,
                user: {
                    id: "admin-123",
                    email: "admin@example.com",
                    role: "admin",
                },
                correlationId: "test-correlation-123",
            };

            const request = new NextRequest("http://localhost:3000/api/admin/test", {
                headers: {
                    "x-forwarded-for": "192.168.1.1",
                    "user-agent": "Mozilla/5.0",
                },
            });

            logAdminAction(
                authResult,
                request,
                "TEST_ACTION",
                "test-resource",
                true,
                { key: "value" },
            );

            expect(consoleSpy).toHaveBeenCalledWith(
                "[ADMIN-AUDIT]",
                expect.objectContaining({
                    correlationId: "test-correlation-123",
                    adminUserId: "admin-123",
                    adminEmail: "admin@example.com",
                    action: "TEST_ACTION",
                    resource: "test-resource",
                    success: true,
                    details: { key: "value" },
                    ip: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                }),
            );
            // Timestamp sollte vorhanden sein
            expect(consoleSpy.mock.calls[0][1].timestamp).toBeDefined();

            consoleSpy.mockRestore();
        });

        it("should not log if user is not provided", () => {
            const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

            const authResult = {
                authorized: false,
                correlationId: "test-correlation-123",
            };

            const request = new NextRequest("http://localhost:3000/api/admin/test");

            logAdminAction(
                authResult,
                request,
                "TEST_ACTION",
                "test-resource",
                true,
            );

            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe("aDMIN_ROLES configuration", () => {
        it("should contain expected admin roles", () => {
            expect(ADMIN_ROLES).toEqual(["admin", "super_admin"]);
        });
    });
});
