/**
 * Test suite for /api/user/recipes/[id] route handlers
 * Tests standardized error handling with security headers and proper status codes
 */

import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockAuthSession } from "@/__tests__/utils/auth-mocks";

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
                    limit: vi.fn(() => Promise.resolve([])),
                })),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn(() => Promise.resolve([])),
                })),
            })),
        })),
        transaction: vi.fn(),
    },
}));

vi.mock("@/lib/db/schemas", () => ({
    recipes: {
        id: "id",
        userId: "userId",
        isDeleted: "isDeleted",
        updatedAt: "updatedAt",
    },
    ingredients: {
        recipeId: "recipeId",
        userId: "userId",
        isDeleted: "isDeleted",
        order: "order",
        updatedAt: "updatedAt",
    },
}));

vi.mock("drizzle-orm", () => ({
    and: vi.fn(),
    eq: vi.fn(),
}));

vi.mock("@/lib/utils/api-error-response", () => ({
    createApiErrorResponse: vi.fn(),
}));

vi.mock("next/headers", () => ({
    headers: vi.fn(() => Promise.resolve(new Headers())),
}));

vi.mock("@/lib/utils/logger", () => ({
    createRequestLogger: vi.fn(() => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    })),
}));

// Import route handlers after mocking
let GET: any, PUT: any, DELETE: any;

beforeEach(async () => {
    vi.clearAllMocks();

    // Reset modules to ensure clean imports
    vi.resetModules();

    // Re-import route handlers
    const routeModule = await import("@/app/api/user/recipes/[id]/route");
    GET = routeModule.GET;
    PUT = routeModule.PUT;
    DELETE = routeModule.DELETE;
});

describe("/api/user/recipes/[id] - GET", () => {
    it("should return standardized error response for unauthorized access", async () => {
        const { auth } = await import("@/lib/auth/auth");
        const { createApiErrorResponse } = await import("@/lib/utils/api-error-response");

        // Arrange
        const request = new NextRequest("http://localhost:3000/api/user/recipes/test-id");
        const params = Promise.resolve({ id: "test-id" });

        (auth.api.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (createApiErrorResponse as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
            NextResponse.json({
                success: false,
                error: { type: "AUTH_ERROR", message: "Unauthorized" },
            }, { status: 401 }),
        );

        // Act
        const _response = await GET(request, { params });

        // Assert
        expect(createApiErrorResponse).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "AUTH_ERROR",
                message: "Unauthorized",
            }),
            "Recipe access denied",
            401,
        );
    });

    it("should return standardized error response for recipe not found", async () => {
        const { auth } = await import("@/lib/auth/auth");
        const { db } = await import("@/lib/db");
        const { createApiErrorResponse } = await import("@/lib/utils/api-error-response");

        // Arrange
        const request = new NextRequest("http://localhost:3000/api/user/recipes/nonexistent-id");
        const params = Promise.resolve({ id: "nonexistent-id" });

        const mockAuth = createMockAuthSession(
            { id: "user-123", email: "test@example.com" },
        );
        (auth.api.getSession as any).mockResolvedValue(mockAuth);

        // Mock empty recipe result
        const mockSelect = {
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    limit: vi.fn(() => Promise.resolve([])),
                })),
            })),
        };
        vi.mocked(db.select).mockReturnValue(mockSelect as any);

        (createApiErrorResponse as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
            NextResponse.json({
                success: false,
                error: { type: "NOT_FOUND_ERROR", message: "Recipe not found" },
            }, { status: 404 }),
        );

        // Act
        const _response = await GET(request, { params });

        // Assert
        expect(createApiErrorResponse).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "NOT_FOUND_ERROR",
                message: "Recipe not found",
            }),
            "Recipe retrieval failed",
            404,
        );
    });
});

describe("/api/user/recipes/[id] - PUT", () => {
    it("should return standardized error response for unauthorized update", async () => {
        const { auth } = await import("@/lib/auth/auth");
        const { createApiErrorResponse } = await import("@/lib/utils/api-error-response");

        // Arrange
        const request = new NextRequest("http://localhost:3000/api/user/recipes/test-id", {
            method: "PUT",
            body: JSON.stringify({ title: "Updated Recipe" }),
            headers: { "Content-Type": "application/json" },
        });
        const params = Promise.resolve({ id: "test-id" });

        (auth.api.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (createApiErrorResponse as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
            NextResponse.json({
                success: false,
                error: { type: "AUTH_ERROR", message: "Unauthorized" },
            }, { status: 401 }),
        );

        // Act
        const _response = await PUT(request, { params });

        // Assert
        expect(createApiErrorResponse).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "AUTH_ERROR",
                message: "Unauthorized",
            }),
            "Recipe update denied",
            401,
        );
    });
});

describe("/api/user/recipes/[id] - DELETE", () => {
    it("should return standardized error response for unauthorized deletion", async () => {
        const { auth } = await import("@/lib/auth/auth");
        const { createApiErrorResponse } = await import("@/lib/utils/api-error-response");

        // Arrange
        const request = new NextRequest("http://localhost:3000/api/user/recipes/test-id", {
            method: "DELETE",
        });
        const params = Promise.resolve({ id: "test-id" });

        (auth.api.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (createApiErrorResponse as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
            NextResponse.json({
                success: false,
                error: { type: "AUTH_ERROR", message: "Unauthorized" },
            }, { status: 401 }),
        );

        // Act
        const _response = await DELETE(request, { params });

        // Assert
        expect(createApiErrorResponse).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "AUTH_ERROR",
                message: "Unauthorized",
            }),
            "Recipe deletion denied",
            401,
        );
    });
});
