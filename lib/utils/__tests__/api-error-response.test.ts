/**
 * Tests for standardized API error response system
 */

import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";

import { createApiErrorResponse } from "../api-error-response";

describe("createApiErrorResponse", () => {
    it("should create standardized error response from Error", () => {
        const error = new Error("Test error");
        const response = createApiErrorResponse(error, "test context");

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(500);
    });

    it("should return standardized response body structure", async () => {
        const error = new Error("Test error");
        const response = createApiErrorResponse(error, "test context");
        const body = await response.json();

        expect(body).toEqual({
            success: false,
            error: expect.objectContaining({
                type: "generic",
                message: "Test error",
            }),
        });
    });

    it("should include security headers in response", () => {
        const error = new Error("Test error");
        const response = createApiErrorResponse(error);

        expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
        expect(response.headers.get("Cache-Control")).toBe("no-cache, no-store, must-revalidate");
    });

    it("should return 400 for validation errors when status override provided", () => {
        const error = new Error("Validation failed");
        const response = createApiErrorResponse(error, "validation", 400);

        expect(response.status).toBe(400);
    });
});
