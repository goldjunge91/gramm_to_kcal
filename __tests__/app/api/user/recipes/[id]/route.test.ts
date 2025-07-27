/**
 * Test suite for /api/user/recipes/[id] route handlers
 * Tests standardized error handling with security headers and proper status codes
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { createApiErrorResponse } from "@/lib/utils/api-error-response";

// Mock dependencies
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/db");
vi.mock("@/lib/utils/api-error-response");
vi.mock("next/headers", () => ({
    headers: vi.fn().mockResolvedValue(new Headers()),
}));

const mockAuth = vi.mocked(auth);
const mockDb = vi.mocked(db);
const mockCreateApiErrorResponse = vi.mocked(createApiErrorResponse);

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
        // Arrange
        const request = new NextRequest("http://localhost:3000/api/user/recipes/test-id");
        const params = Promise.resolve({ id: "test-id" });

        mockAuth.api.getSession.mockResolvedValue(null);
        mockCreateApiErrorResponse.mockReturnValue(
            new Response(JSON.stringify({
                success: false,
                error: { type: "AUTH_ERROR", message: "Unauthorized" },
            }), { status: 401 }),
        );

        // Act
        const _response = await GET(request, { params });

        // Assert
        expect(mockCreateApiErrorResponse).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "AUTH_ERROR",
                message: "Unauthorized",
            }),
            "Recipe access denied",
            401,
        );
    });

    it("should return standardized error response for recipe not found", async () => {
        // Arrange
        const request = new NextRequest("http://localhost:3000/api/user/recipes/nonexistent-id");
        const params = Promise.resolve({ id: "nonexistent-id" });

        mockAuth.api.getSession.mockResolvedValue({
            user: { id: "user-123" },
        });

        // Mock empty recipe result
        mockDb.select.mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([]),
                }),
            }),
        });

        mockCreateApiErrorResponse.mockReturnValue(
            new Response(JSON.stringify({
                success: false,
                error: { type: "NOT_FOUND_ERROR", message: "Recipe not found" },
            }), { status: 404 }),
        );

        // Act
        const _response = await GET(request, { params });

        // Assert
        expect(mockCreateApiErrorResponse).toHaveBeenCalledWith(
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
        // Arrange
        const request = new NextRequest("http://localhost:3000/api/user/recipes/test-id", {
            method: "PUT",
            body: JSON.stringify({ title: "Updated Recipe" }),
            headers: { "Content-Type": "application/json" },
        });
        const params = Promise.resolve({ id: "test-id" });

        mockAuth.api.getSession.mockResolvedValue(null);
        mockCreateApiErrorResponse.mockReturnValue(
            new Response(JSON.stringify({
                success: false,
                error: { type: "AUTH_ERROR", message: "Unauthorized" },
            }), { status: 401 }),
        );

        // Act
        const _response = await PUT(request, { params });

        // Assert
        expect(mockCreateApiErrorResponse).toHaveBeenCalledWith(
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
        // Arrange
        const request = new NextRequest("http://localhost:3000/api/user/recipes/test-id", {
            method: "DELETE",
        });
        const params = Promise.resolve({ id: "test-id" });

        mockAuth.api.getSession.mockResolvedValue(null);
        mockCreateApiErrorResponse.mockReturnValue(
            new Response(JSON.stringify({
                success: false,
                error: { type: "AUTH_ERROR", message: "Unauthorized" },
            }), { status: 401 }),
        );

        // Act
        const _response = await DELETE(request, { params });

        // Assert
        expect(mockCreateApiErrorResponse).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "AUTH_ERROR",
                message: "Unauthorized",
            }),
            "Recipe deletion denied",
            401,
        );
    });
});
