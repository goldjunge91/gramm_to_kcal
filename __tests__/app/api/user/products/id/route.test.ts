/**
 * Tests for user products by ID API route
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockAuthSession } from "@/__tests__/utils/auth-mocks";
import { DELETE, PUT } from "@/app/api/user/products/[id]/route";

// Mock dependencies
vi.mock("@/lib/auth/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}));

vi.mock("@/lib/db", () => ({
    db: {
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn(() => Promise.resolve([])),
                })),
            })),
        })),
    },
}));

vi.mock("@/lib/db/schemas", () => ({
    products: {
        id: "id",
        userId: "userId",
        updatedAt: "updatedAt",
        isDeleted: "isDeleted",
    },
}));

vi.mock("drizzle-orm", () => ({
    and: vi.fn(),
    eq: vi.fn(),
}));

vi.mock("next/headers", () => ({
    headers: vi.fn(() => Promise.resolve(new Headers())),
}));

describe("/api/user/products/[id]", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("pUT", () => {
        it("should update product when authenticated and authorized", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockAuth = createMockAuthSession(
                { id: "user123", email: "test@example.com" },
            );
            const updatedProduct = {
                id: "product123",
                name: "Updated Product",
                userId: "user123",
                updatedAt: new Date(),
            };

            vi.mocked(auth.api.getSession).mockResolvedValue(mockAuth);

            const mockUpdate = {
                set: vi.fn(() => ({
                    where: vi.fn(() => ({
                        returning: vi.fn(() =>
                            Promise.resolve([updatedProduct]),
                        ),
                    })),
                })),
            };
            vi.mocked(db.update).mockReturnValue(mockUpdate as any);

            const request = new NextRequest(
                "http://localhost:3000/api/user/products/product123",
                {
                    method: "PUT",
                    body: JSON.stringify({ name: "Updated Product" }),
                },
            );

            const response = await PUT(request, {
                params: { id: "product123" },
            });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.id).toBe("product123");
            expect(data.name).toBe("Updated Product");
        });

        it("should return 401 when not authenticated", async () => {
            const { auth } = await import("@/lib/auth/auth");

            vi.mocked(auth.api.getSession).mockResolvedValue(null);

            const request = new NextRequest(
                "http://localhost:3000/api/user/products/product123",
                {
                    method: "PUT",
                    body: JSON.stringify({ name: "Updated Product" }),
                },
            );

            const response = await PUT(request, {
                params: { id: "product123" },
            });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });

        it("should return 404 when product not found or not owned by user", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockAuth = createMockAuthSession(
                { id: "user123", email: "test@example.com" },
            );
            vi.mocked(auth.api.getSession).mockResolvedValue(mockAuth);

            const mockUpdate = {
                set: vi.fn(() => ({
                    where: vi.fn(() => ({
                        returning: vi.fn(() => Promise.resolve([])), // No product found
                    })),
                })),
            };
            vi.mocked(db.update).mockReturnValue(mockUpdate as any);

            const request = new NextRequest(
                "http://localhost:3000/api/user/products/nonexistent",
                {
                    method: "PUT",
                    body: JSON.stringify({ name: "Updated Product" }),
                },
            );

            const response = await PUT(request, {
                params: { id: "nonexistent" },
            });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe("Product not found");
        });

        it("should handle database errors during update", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockAuth = createMockAuthSession(
                { id: "user123", email: "test@example.com" },
            );
            vi.mocked(auth.api.getSession).mockResolvedValue(mockAuth);

            const mockUpdate = {
                set: vi.fn(() => ({
                    where: vi.fn(() => ({
                        returning: vi.fn(() =>
                            Promise.reject(new Error("Database update failed")),
                        ),
                    })),
                })),
            };
            vi.mocked(db.update).mockReturnValue(mockUpdate as any);

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const request = new NextRequest(
                "http://localhost:3000/api/user/products/product123",
                {
                    method: "PUT",
                    body: JSON.stringify({ name: "Updated Product" }),
                },
            );

            const response = await PUT(request, {
                params: { id: "product123" },
            });
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Internal server error");
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error updating product:",
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });
    });

    describe("dELETE", () => {
        it("should soft delete product when authenticated and authorized", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockAuth = createMockAuthSession(
                { id: "user123", email: "test@example.com" },
            );
            const deletedProduct = {
                id: "product123",
                isDeleted: true,
                userId: "user123",
                updatedAt: new Date(),
            };

            vi.mocked(auth.api.getSession).mockResolvedValue(mockAuth);

            const mockUpdate = {
                set: vi.fn(() => ({
                    where: vi.fn(() => ({
                        returning: vi.fn(() =>
                            Promise.resolve([deletedProduct]),
                        ),
                    })),
                })),
            };
            vi.mocked(db.update).mockReturnValue(mockUpdate as any);

            const request = new NextRequest(
                "http://localhost:3000/api/user/products/product123",
                {
                    method: "DELETE",
                },
            );

            const response = await DELETE(request, {
                params: { id: "product123" },
            });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe("Product deleted successfully");
        });

        it("should return 401 when not authenticated", async () => {
            const { auth } = await import("@/lib/auth/auth");

            vi.mocked(auth.api.getSession).mockResolvedValue(null);

            const request = new NextRequest(
                "http://localhost:3000/api/user/products/product123",
                {
                    method: "DELETE",
                },
            );

            const response = await DELETE(request, {
                params: { id: "product123" },
            });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });

        it("should return 404 when product not found or not owned by user", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockAuth = createMockAuthSession(
                { id: "user123", email: "test@example.com" },
            );
            vi.mocked(auth.api.getSession).mockResolvedValue(mockAuth);

            const mockUpdate = {
                set: vi.fn(() => ({
                    where: vi.fn(() => ({
                        returning: vi.fn(() => Promise.resolve([])), // No product found
                    })),
                })),
            };
            vi.mocked(db.update).mockReturnValue(mockUpdate as any);

            const request = new NextRequest(
                "http://localhost:3000/api/user/products/nonexistent",
                {
                    method: "DELETE",
                },
            );

            const response = await DELETE(request, {
                params: { id: "nonexistent" },
            });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe("Product not found");
        });

        it("should handle database errors during deletion", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockAuth = createMockAuthSession(
                { id: "user123", email: "test@example.com" },
            );
            vi.mocked(auth.api.getSession).mockResolvedValue(mockAuth);

            const mockUpdate = {
                set: vi.fn(() => ({
                    where: vi.fn(() => ({
                        returning: vi.fn(() =>
                            Promise.reject(new Error("Database delete failed")),
                        ),
                    })),
                })),
            };
            vi.mocked(db.update).mockReturnValue(mockUpdate as any);

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const request = new NextRequest(
                "http://localhost:3000/api/user/products/product123",
                {
                    method: "DELETE",
                },
            );

            const response = await DELETE(request, {
                params: { id: "product123" },
            });
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Internal server error");
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error deleting product:",
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });

        it("should use soft delete (isDeleted flag) instead of hard delete", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockAuth = createMockAuthSession(
                { id: "user123", email: "test@example.com" },
            );
            const deletedProduct = {
                id: "product123",
                isDeleted: true,
                updatedAt: new Date(),
            };

            vi.mocked(auth.api.getSession).mockResolvedValue(mockAuth);

            let capturedSetValues: any;
            const mockUpdate = {
                set: vi.fn((values) => {
                    capturedSetValues = values;
                    return {
                        where: vi.fn(() => ({
                            returning: vi.fn(() =>
                                Promise.resolve([deletedProduct]),
                            ),
                        })),
                    };
                }),
            };
            vi.mocked(db.update).mockReturnValue(mockUpdate as any);

            const request = new NextRequest(
                "http://localhost:3000/api/user/products/product123",
                {
                    method: "DELETE",
                },
            );

            await DELETE(request, { params: { id: "product123" } });

            expect(capturedSetValues.isDeleted).toBe(true);
            expect(capturedSetValues.updatedAt).toBeInstanceOf(Date);
        });
    });
});
