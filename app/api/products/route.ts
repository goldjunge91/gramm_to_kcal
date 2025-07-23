import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

// Note: Rate limiting handled by Better Auth middleware
import {
    cachedLookupProductByBarcode,
    cachedSearchProductsByName,
} from "@/lib/api/cached-product-lookup";
import {
    getSecurityHeaders,
    RequestSchemas,
    validateContentType,
    validateRequest,
    validateRequestSize,
} from "@/lib/validations/request-validation";

export async function GET(request: NextRequest) {
    // Note: Rate limiting handled by Better Auth middleware and cached-product-lookup internal limits

    // Validate query parameters if searching
    const url = new URL(request.url);
    const barcode = url.searchParams.get("barcode");
    const searchQuery = url.searchParams.get("q");

    if (barcode) {
        const validation = await validateRequest(
            request,
            RequestSchemas.barcodeQuery,
            { source: "query" },
        );

        if (!validation.success) {
            const securityHeaders = getSecurityHeaders();
            return NextResponse.json(
                { error: "Invalid barcode format", details: validation.error },
                { status: 400, headers: securityHeaders },
            );
        }

        // Implement barcode lookup with cached API
        try {
            const result = await cachedLookupProductByBarcode(
                validation.data.barcode,
                request,
            );

            const securityHeaders = getSecurityHeaders();

            if (!result.success) {
                return NextResponse.json(
                    {
                        error: result.error || "Product not found",
                        source: result.source,
                        cached: result.cached,
                        rateLimit: result.rateLimit,
                    },
                    { status: 404, headers: securityHeaders },
                );
            }

            return NextResponse.json(
                {
                    success: true,
                    product: result.product,
                    source: result.source,
                    cached: result.cached,
                    rateLimit: result.rateLimit,
                },
                { headers: securityHeaders },
            );
        }
        catch (error) {
            console.error("Barcode lookup error:", error);
            const securityHeaders = getSecurityHeaders();
            return NextResponse.json(
                { error: "Internal server error during barcode lookup" },
                { status: 500, headers: securityHeaders },
            );
        }
    }

    if (searchQuery !== null) {
        if (!searchQuery || searchQuery.trim() === "") {
            const securityHeaders = getSecurityHeaders();
            return NextResponse.json(
                { error: "Invalid search query" },
                { status: 400, headers: securityHeaders },
            );
        }
        const validation = await validateRequest(
            request,
            RequestSchemas.searchQuery,
            { source: "query" },
        );

        if (!validation.success) {
            const securityHeaders = getSecurityHeaders();
            return NextResponse.json(
                { error: "Invalid search query", details: validation.error },
                { status: 400, headers: securityHeaders },
            );
        }

        // Implement product search with pagination
        try {
            const limit = Number.parseInt(url.searchParams.get("limit") || "10", 10);
            const clampedLimit = Math.min(Math.max(limit, 1), 50); // Clamp between 1-50
            const offset = Math.max(
                Number.parseInt(url.searchParams.get("offset") || "0", 10),
                0,
            );

            const result = await cachedSearchProductsByName(
                validation.data.q,
                clampedLimit,
                request,
                offset,
            );

            const securityHeaders = getSecurityHeaders();

            // Calculate pagination metadata
            const totalResults = result.totalCount || 0;
            const hasMore = offset + clampedLimit < totalResults;
            const nextOffset = hasMore ? offset + clampedLimit : null;
            const prevOffset = offset > 0 ? Math.max(offset - clampedLimit, 0) : null;

            return NextResponse.json(
                {
                    success: result.success,
                    products: result.products,
                    pagination: {
                        limit: clampedLimit,
                        offset,
                        total: totalResults,
                        hasMore,
                        nextOffset,
                        prevOffset,
                        count: result.products?.length || 0,
                    },
                    source: result.source,
                    cached: result.cached,
                    rateLimit: result.rateLimit,
                    query: validation.data.q,
                },
                { headers: securityHeaders },
            );
        }
        catch (error) {
            console.error("Product search error:", error);
            const securityHeaders = getSecurityHeaders();
            return NextResponse.json(
                { error: "Internal server error during product search" },
                { status: 500, headers: securityHeaders },
            );
        }
    }

    const headers = getSecurityHeaders();
    return NextResponse.json({ message: "Products API endpoint" }, { headers });
}

export async function POST(request: NextRequest) {
    // Validate request size and content type
    if (!validateRequestSize(request, 1024 * 10)) {
        // 10KB limit
        const securityHeaders = getSecurityHeaders();
        return NextResponse.json(
            { error: "Request too large" },
            { status: 413, headers: securityHeaders },
        );
    }

    if (!validateContentType(request, ["application/json"])) {
        const securityHeaders = getSecurityHeaders();
        return NextResponse.json(
            { error: "Invalid content type" },
            { status: 415, headers: securityHeaders },
        );
    }

    // Note: Rate limiting handled by Better Auth middleware

    // Validate request body with Zod
    const validation = await validateRequest(
        request,
        RequestSchemas.createProduct,
    );

    if (!validation.success) {
        const securityHeaders = getSecurityHeaders();

        return NextResponse.json(
            { error: "Invalid request data", details: validation.error },
            { status: 400, headers: securityHeaders },
        );
    }

    // TODO: Implement actual product creation logic with validation.data
    const { name, quantity, kcal } = validation.data;

    const headers = getSecurityHeaders();
    return NextResponse.json(
        {
            message: "Product created successfully",
            product: { name, quantity, kcal },
        },
        { headers },
    );
}
