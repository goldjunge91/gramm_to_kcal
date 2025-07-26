/**
 * Tests for products API route
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "../../../../app/api/products/route";

// Mock validation module
vi.mock("../../../../lib/validations/request-validation", () => ({
    validateRequest: vi.fn(),
    validateRequestSize: vi.fn(),
    validateContentType: vi.fn(),
    getSecurityHeaders: vi.fn(() => new Headers()),
    RequestSchemas: {
        barcodeQuery: { parse: vi.fn() },
        searchQuery: { parse: vi.fn() },
        createProduct: { parse: vi.fn() },
    },
}));

// Mock cached product lookup
vi.mock("../../../../lib/api/cached-product-lookup", () => ({
    cachedLookupProductByBarcode: vi.fn(),
    cachedSearchProductsByName: vi.fn(),
}));

describe("/api/products", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("gET", () => {
        it("should validate barcode query parameter", async () => {
            const { validateRequest } = await import(
                "../../../../lib/validations/request-validation"
            );
            const { cachedLookupProductByBarcode } = await import(
                "../../../../lib/api/cached-product-lookup"
            );

            vi.mocked(validateRequest).mockResolvedValue({
                success: true,
                data: { barcode: "1234567890123" },
            });

            vi.mocked(cachedLookupProductByBarcode).mockResolvedValue({
                success: true,
                product: {
                    name: "Test Product",
                    quantity: 100,
                    kcal: 150,
                },
                source: "api",
                cached: false,
                rateLimit: {
                    remaining: 10,
                    resetTime: Date.now() + 60000,
                    blocked: false,
                },
            });

            const request = new NextRequest(
                "http://localhost:3000/api/products?barcode=1234567890123",
            );
            const response = await GET(request);

            expect(validateRequest).toHaveBeenCalledWith(
                request,
                expect.anything(),
                { source: "query" },
            );
            expect(response.status).toBe(200);
        });

        it("should return error for invalid barcode", async () => {
            const { validateRequest, getSecurityHeaders } = await import(
                "../../../../lib/validations/request-validation"
            );

            vi.mocked(validateRequest).mockResolvedValue({
                success: false,
                error: "Invalid barcode format",
            });
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());

            const request = new NextRequest(
                "http://localhost:3000/api/products?barcode=invalid",
            );
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe("Invalid barcode format");
        });

        it("should validate search query parameter", async () => {
            const { validateRequest } = await import(
                "../../../../lib/validations/request-validation"
            );
            const { cachedSearchProductsByName } = await import(
                "../../../../lib/api/cached-product-lookup"
            );

            vi.mocked(validateRequest).mockResolvedValue({
                success: true,
                data: { q: "coca cola" },
            });

            vi.mocked(cachedSearchProductsByName).mockResolvedValue({
                success: true,
                products: [
                    {
                        success: true,
                        product: {
                            name: "Coca Cola",
                            quantity: 100,
                            kcal: 42,
                        },
                        source: "api",
                    },
                ],
                totalCount: 1,
                source: "api",
                cached: false,
                rateLimit: {
                    remaining: 10,
                    resetTime: Date.now() + 60000,
                    blocked: false,
                },
            });

            const request = new NextRequest(
                "http://localhost:3000/api/products?q=coca+cola",
            );
            const response = await GET(request);

            expect(validateRequest).toHaveBeenCalledWith(
                request,
                expect.anything(),
                { source: "query" },
            );
            expect(response.status).toBe(200);
        });

        it("should return error for invalid search query", async () => {
            const { validateRequest, getSecurityHeaders } = await import(
                "../../../../lib/validations/request-validation"
            );

            vi.mocked(validateRequest).mockResolvedValue({
                success: false,
                error: "Invalid search query",
            });
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());

            const request = new NextRequest(
                "http://localhost:3000/api/products?q=",
            );
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe("Invalid search query");
        });

        it("should return success response without parameters", async () => {
            const { getSecurityHeaders } = await import(
                "../../../../lib/validations/request-validation"
            );
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());

            const request = new NextRequest(
                "http://localhost:3000/api/products",
            );
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
        });
    });

    describe("pOST", () => {
        it("should reject requests that are too large", async () => {
            const { validateRequestSize, getSecurityHeaders } = await import(
                "../../../../lib/validations/request-validation"
            );

            vi.mocked(validateRequestSize).mockReturnValue(false);
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());

            const request = new NextRequest(
                "http://localhost:3000/api/products",
                {
                    method: "POST",
                    body: JSON.stringify({ name: "test" }),
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(413);
            expect(data.error).toBe("Request too large");
        });

        it("should reject invalid content type", async () => {
            const {
                validateRequestSize,
                validateContentType,
                getSecurityHeaders,
            } = await import("../../../../lib/validations/request-validation");

            vi.mocked(validateRequestSize).mockReturnValue(true);
            vi.mocked(validateContentType).mockReturnValue(false);
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());

            const request = new NextRequest(
                "http://localhost:3000/api/products",
                {
                    method: "POST",
                    headers: { "content-type": "text/plain" },
                    body: "invalid",
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(415);
            expect(data.error).toBe("Invalid content type");
        });

        it("should validate request body with Zod schema", async () => {
            const {
                validateRequestSize,
                validateContentType,
                validateRequest,
                getSecurityHeaders,
            } = await import("../../../../lib/validations/request-validation");

            vi.mocked(validateRequestSize).mockReturnValue(true);
            vi.mocked(validateContentType).mockReturnValue(true);
            vi.mocked(validateRequest).mockResolvedValue({
                success: false,
                error: "Invalid request data",
            });
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());

            const request = new NextRequest(
                "http://localhost:3000/api/products",
                {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ invalid: "data" }),
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe("Invalid request data");
        });

        it("should create product successfully with valid data", async () => {
            const {
                validateRequestSize,
                validateContentType,
                validateRequest,
                getSecurityHeaders,
            } = await import("../../../../lib/validations/request-validation");

            vi.mocked(validateRequestSize).mockReturnValue(true);
            vi.mocked(validateContentType).mockReturnValue(true);
            vi.mocked(validateRequest).mockResolvedValue({
                success: true,
                data: { name: "Test Product", quantity: 100, kcal: 200 },
            });
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());

            const request = new NextRequest(
                "http://localhost:3000/api/products",
                {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        name: "Test Product",
                        quantity: 100,
                        kcal: 200,
                    }),
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe("Product created successfully");
            expect(data.product).toEqual({
                name: "Test Product",
                quantity: 100,
                kcal: 200,
            });
        });
    });
});
