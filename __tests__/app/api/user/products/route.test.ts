/**
 * Tests for user products API route
 */
import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

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
}));

vi.mock("next/headers", () => ({
    headers: vi.fn(() => Promise.resolve(new Headers())),
}));

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
    value: {
        randomUUID: vi.fn(() => 'test-uuid-123'),
    },
});

describe("/api/user/products", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET", () => {
        it("should return user products when authenticated", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");
            
            const mockUser = { id: "user123", email: "test@example.com" };
            const mockProducts = [
                { id: "1", name: "Test Product", userId: "user123" },
                { id: "2", name: "Another Product", userId: "user123" },
            ];

            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: { id: "session123" },
            });
            
            const mockQuery = {
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        orderBy: vi.fn(() => Promise.resolve(mockProducts)),
                    })),
                })),
            };
            vi.mocked(db.select).mockReturnValue(mockQuery);

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual(mockProducts);
        });

        it("should return 401 when not authenticated", async () => {
            const { auth } = await import("@/lib/auth/auth");
            
            vi.mocked(auth.api.getSession).mockResolvedValue(null);

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });

        it("should handle database errors", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");
            
            const mockUser = { id: "user123", email: "test@example.com" };
            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: { id: "session123" },
            });
            
            const mockQuery = {
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        orderBy: vi.fn(() => Promise.reject(new Error("Database connection failed"))),
                    })),
                })),
            };
            vi.mocked(db.select).mockReturnValue(mockQuery);

            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            
            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Internal server error");
            expect(consoleSpy).toHaveBeenCalledWith("Error fetching products:", expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe("POST", () => {
        it("should create product when authenticated", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");
            
            const mockUser = { id: "user123", email: "test@example.com" };
            const productData = { name: "New Product", kcal: 100, quantity: "1 piece" };
            const createdProduct = { 
                id: "test-uuid-123", 
                ...productData, 
                userId: "user123",
                version: 1,
                isDeleted: false,
            };

            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: { id: "session123" },
            });
            
            const mockInsert = {
                values: vi.fn(() => ({
                    returning: vi.fn(() => Promise.resolve([createdProduct])),
                })),
            };
            vi.mocked(db.insert).mockReturnValue(mockInsert);

            const request = new NextRequest("http://localhost:3000/api/user/products", {
                method: "POST",
                body: JSON.stringify(productData),
            });

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

            const request = new NextRequest("http://localhost:3000/api/user/products", {
                method: "POST",
                body: JSON.stringify({ name: "Test Product" }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });

        it("should handle failed product insertion", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");
            
            const mockUser = { id: "user123", email: "test@example.com" };
            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: { id: "session123" },
            });
            
            const mockInsert = {
                values: vi.fn(() => ({
                    returning: vi.fn(() => Promise.resolve([])), // Empty array indicates failure
                })),
            };
            vi.mocked(db.insert).mockReturnValue(mockInsert);

            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            const request = new NextRequest("http://localhost:3000/api/user/products", {
                method: "POST",
                body: JSON.stringify({ name: "Test Product" }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Failed to create product");
            expect(consoleSpy).toHaveBeenCalledWith("Failed to insert product, no data returned.");
            
            consoleSpy.mockRestore();
        });

        it("should handle database errors during creation", async () => {
            const { auth } = await import("@/lib/auth/auth");
            const { db } = await import("@/lib/db");
            
            const mockUser = { id: "user123", email: "test@example.com" };
            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: mockUser,
                session: { id: "session123" },
            });
            
            const mockInsert = {
                values: vi.fn(() => ({
                    returning: vi.fn(() => Promise.reject(new Error("Database insertion failed"))),
                })),
            };
            vi.mocked(db.insert).mockReturnValue(mockInsert);

            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            const request = new NextRequest("http://localhost:3000/api/user/products", {
                method: "POST",
                body: JSON.stringify({ name: "Test Product" }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Internal server error");
            expect(data.details).toBe("Database insertion failed");
            
            consoleSpy.mockRestore();
        });
    });
});