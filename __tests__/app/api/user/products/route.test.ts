/**
 * Tests for user products API route
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockAuthSession } from "@/__tests__/utils/auth-mocks";
import { GET, POST } from "@/app/api/user/products/route";

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
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    orderBy: vi.fn(() => Promise.resolve([])),
                })),
            })),
        })),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => Promise.resolve([])),
            })),
        })),
    },
}));

vi.mock("@/lib/db/schemas", () => ({
    products: {
        userId: "userId",
        isDeleted: "isDeleted",
        createdAt: "createdAt",
        id: "id",
        version: "version",
        updatedAt: "updatedAt",
    },
}));

vi.mock("drizzle-orm", () => ({
    and: vi.fn(),
    eq: vi.fn(),
    desc: vi.fn(),
    lt: vi.fn(),
}));

vi.mock("next/headers", () => ({
    headers: vi.fn(() => Promise.resolve(new Headers())),
}));

// Mock crypto.randomUUID
Object.defineProperty(globalThis, "crypto", {
    value: {
        randomUUID: vi.fn(() => "test-uuid-123"),
    },
});

describe("/api/user/products", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("gET", () => {
        it("should return user products when authenticated", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockUser = {
                id: "user123",
                email: "test@example.com",
                emailVerified: true,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                banned: false,
            };
            const mockProducts = [
                { id: "1", name: "Test Product", userId: "user123", createdAt: "2024-01-01T00:00:00.000Z" },
                { id: "2", name: "Another Product", userId: "user123", createdAt: "2024-01-02T00:00:00.000Z" },
            ];

            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: {
                    id: "session123",
                    userId: "user123",
                    expiresAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    token: "test-token",
                },
            });

            const mockQuery = {
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        orderBy: vi.fn(() => ({
                            limit: vi.fn(() => Promise.resolve(mockProducts)),
                        })),
                    })),
                })),
                fields: {},
                session: undefined,
                dialect: {},
                withList: [],
                distinct: undefined,
            } as any;
            vi.mocked(db.select).mockReturnValue(mockQuery);

            const request = new NextRequest("http://localhost:3000/api/user/products");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.products).toEqual(mockProducts);
            expect(data.pagination).toBeDefined();
            expect(data.pagination.limit).toBe(20); // Default limit
        });

        it("should support pagination with cursor", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockUser = {
                id: "user123",
                email: "test@example.com",
                emailVerified: true,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                banned: false,
            };
            const mockProducts = [
                { id: "3", name: "Older Product", userId: "user123", createdAt: "2023-12-31T00:00:00.000Z" },
            ];

            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: {
                    id: "session123",
                    userId: "user123",
                    expiresAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    token: "test-token",
                },
            });

            const mockQuery = {
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        orderBy: vi.fn(() => ({
                            limit: vi.fn(() => Promise.resolve(mockProducts)),
                        })),
                    })),
                })),
                fields: {},
                session: undefined,
                dialect: {},
                withList: [],
                distinct: undefined,
            } as any;
            vi.mocked(db.select).mockReturnValue(mockQuery);

            const request = new NextRequest("http://localhost:3000/api/user/products?cursor=2024-01-01T00:00:00.000Z&limit=10");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.products).toEqual(mockProducts);
            expect(data.pagination.limit).toBe(10);
            expect(data.pagination.cursor).toBe("2024-01-01T00:00:00.000Z");
        });

        it("should return 401 when not authenticated", async () => {
            const { auth } = await import("@/lib/auth/auth");

            vi.mocked(auth.api.getSession).mockResolvedValue(null);

            const request = new NextRequest("http://localhost:3000/api/user/products");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });

        it("should handle database errors", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockAuth = createMockAuthSession({
                id: "user123",
                email: "test@example.com",
                emailVerified: true,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                banned: false,
            });
            vi.mocked(auth.api.getSession).mockResolvedValue(mockAuth);

            const mockQuery = {
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        orderBy: vi.fn(() => ({
                            limit: vi.fn(() =>
                                Promise.reject(
                                    new Error("Database connection failed"),
                                ),
                            ),
                        })),
                    })),
                })),
                fields: {},
                session: undefined,
                dialect: {},
                withList: [],
                distinct: undefined,
            } as any;
            vi.mocked(db.select).mockReturnValue(mockQuery);

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const request = new NextRequest("http://localhost:3000/api/user/products");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Internal server error");
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error fetching products:",
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });
    });

    describe("pOST", () => {
        it("should create product when authenticated", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockUser = {
                id: "user123",
                email: "test@example.com",
                emailVerified: true,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                banned: false,
            };
            const productData = {
                name: "New Product",
                kcal: 100,
                quantity: 1,
            };
            const createdProduct = {
                id: "test-uuid-123",
                ...productData,
                userId: "user123",
                version: 1,
                isDeleted: false,
            };

            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: {
                    id: "session123",
                    userId: "user123",
                    expiresAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    token: "test-token",
                },
            });

            const mockInsert = {
                values: vi.fn(() => ({
                    returning: vi.fn(() => Promise.resolve([createdProduct])),
                })),
            };
            vi.mocked(db.insert).mockReturnValue(mockInsert as any);

            const request = new NextRequest(
                "http://localhost:3000/api/user/products",
                {
                    method: "POST",
                    body: JSON.stringify(productData),
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.id).toBe("test-uuid-123");
            expect(data.name).toBe("New Product");
            expect(data.userId).toBe("user123");
        });

        it("should return 401 when not authenticated", async () => {
            const { auth } = await import("@/lib/auth/auth");

            vi.mocked(auth.api.getSession).mockResolvedValue(null);

            const request = new NextRequest(
                "http://localhost:3000/api/user/products",
                {
                    method: "POST",
                    body: JSON.stringify({ name: "Test Product" }),
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });

        it("should handle failed product insertion", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockAuth = createMockAuthSession({
                id: "user123",
                email: "test@example.com",
                emailVerified: true,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                banned: false,
            });
            vi.mocked(auth.api.getSession).mockResolvedValue(mockAuth);

            const mockInsert = {
                values: vi.fn(() => ({
                    returning: vi.fn(() => Promise.resolve([])), // Empty array indicates failure
                })),
            };
            vi.mocked(db.insert).mockReturnValue(mockInsert as any);

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const request = new NextRequest(
                "http://localhost:3000/api/user/products",
                {
                    method: "POST",
                    body: JSON.stringify({ name: "Test Product" }),
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Failed to create product");
            expect(consoleSpy).toHaveBeenCalledWith(
                "Failed to insert product, no data returned.",
            );

            consoleSpy.mockRestore();
        });

        it("should handle database errors during creation", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");

            const mockAuth = createMockAuthSession({
                id: "user123",
                email: "test@example.com",
                emailVerified: true,
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                banned: false,
            });
            vi.mocked(auth.api.getSession).mockResolvedValue(mockAuth);

            const mockInsert = {
                values: vi.fn(() => ({
                    returning: vi.fn(() =>
                        Promise.reject(new Error("Database insertion failed")),
                    ),
                })),
            };
            vi.mocked(db.insert).mockReturnValue(mockInsert as any);

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const request = new NextRequest(
                "http://localhost:3000/api/user/products",
                {
                    method: "POST",
                    body: JSON.stringify({ name: "Test Product" }),
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Internal server error");
            expect(data.details).toBe("Database insertion failed");

            consoleSpy.mockRestore();
        });
    });
});
