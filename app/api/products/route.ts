import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import fs from "node:fs/promises";

// Note: Rate limiting handled by Better Auth middleware
import {
    cachedLookupProductByBarcode,
    cachedSearchProductsByName,
} from "@/lib/api/cached-product-lookup";
import {
    CacheStrategies,
    createNoCacheHeaders,
    createPublicCacheHeaders,
    handleETaggedResponse,
} from "@/lib/utils/cache-headers";
import { createApiErrorResponse } from "@/lib/utils/api-error-response";
import { extractErrorMessage } from "@/lib/utils/error-utils";
import { createRequestLogger } from "@/lib/utils/logger";
import {
    getSecurityHeaders,
    RequestSchemas,
    validateContentType,
    validateRequest,
    validateRequestSize,
} from "@/lib/validations/request-validation";

// Simple product type for JSON file handling (not the full database schema)
interface SimpleProduct {
    id: string;
    name: string;
    quantity: number;
    kcal: number;
    unit: string;
}

export async function GET(request: NextRequest) {
    const logger = createRequestLogger(request);
    logger.info("Products API request received", {
        method: "GET",
        searchParams: Object.fromEntries(new URL(request.url).searchParams),
    });

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
            logger.warn("Invalid barcode format in request", {
                barcode,
                validationError: validation.error,
            });
            return createApiErrorResponse(validation.error, "Invalid barcode format", 400);
        }

        // Implement barcode lookup with cached API
        try {
            logger.debug("Starting barcode lookup", { barcode: validation.data.barcode });
            const result = await cachedLookupProductByBarcode(
                validation.data.barcode,
                request,
            );

            const securityHeaders = getSecurityHeaders();

            if (!result.success) {
                logger.info("Product not found for barcode", {
                    barcode: validation.data.barcode,
                    error: result.error,
                    source: result.source,
                    cached: result.cached,
                    rateLimit: result.rateLimit,
                });

                // Don't cache error responses, but add security headers
                if (result.rateLimit) {
                    securityHeaders.set(
                        "X-RateLimit-Remaining",
                        result.rateLimit.remaining.toString(),
                    );
                    const resetDate = new Date(result.rateLimit.resetTime);
                    securityHeaders.set("X-RateLimit-Reset", resetDate.toUTCString());
                }
                return NextResponse.json(
                    {
                        error: result.error || "Product not found",
                        source: result.source,
                        cached: result.cached,
                    },
                    { status: 404, headers: securityHeaders },
                );
            }

            logger.info("Product found for barcode", {
                barcode: validation.data.barcode,
                productName: result.product?.name,
                source: result.source,
                cached: result.cached,
            });

            // Create response data for caching
            const responseData = {
                success: true,
                product: result.product,
                source: result.source,
                cached: result.cached,
            };

            // Create public cache headers for successful product lookups
            const cacheHeaders = createPublicCacheHeaders(
                CacheStrategies.PUBLIC_API.maxAge,
                CacheStrategies.PUBLIC_API.staleWhileRevalidate,
            );

            // Add security headers to cache headers
            for (const [key, value] of securityHeaders.entries()) {
                cacheHeaders.set(key, value);
            }

            if (result.rateLimit) {
                cacheHeaders.set(
                    "X-RateLimit-Remaining",
                    result.rateLimit.remaining.toString(),
                );
                const resetDate = new Date(result.rateLimit.resetTime);
                cacheHeaders.set("X-RateLimit-Reset", resetDate.toUTCString());
            }

            // Return cached response with ETag support
            return handleETaggedResponse(request, responseData, cacheHeaders);
        }
        catch (error) {
            logger.error("Barcode lookup error", {
                barcode: validation.data.barcode,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            return createApiErrorResponse(error, "Internal server error during barcode lookup");
        }
    }

    if (searchQuery !== null) {
        if (!searchQuery || searchQuery.trim() === "") {
            logger.warn("Empty search query received");
            return createApiErrorResponse("Empty search query", "Invalid search query", 400);
        }
        const validation = await validateRequest(
            request,
            RequestSchemas.searchQuery,
            { source: "query" },
        );

        if (!validation.success) {
            logger.warn("Invalid search query validation", {
                query: searchQuery,
                validationError: validation.error,
            });
            return createApiErrorResponse(validation.error, "Invalid search query", 400);
        }

        // Implement product search with pagination
        try {
            const limit = Number.parseInt(url.searchParams.get("limit") || "10", 10);
            const clampedLimit = Math.min(Math.max(limit, 1), 50); // Clamp between 1-50
            const offset = Math.max(
                Number.parseInt(url.searchParams.get("offset") || "0", 10),
                0,
            );

            logger.debug("Starting product search", {
                query: validation.data.q,
                limit: clampedLimit,
                offset,
            });

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

            logger.info("Product search completed", {
                query: validation.data.q,
                resultsFound: result.products?.length || 0,
                totalResults,
                source: result.source,
                cached: result.cached,
            });

            // Create response data for caching
            const responseData = {
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
                query: validation.data.q,
            };

            // Create public cache headers for search results
            const cacheHeaders = createPublicCacheHeaders(
                CacheStrategies.PUBLIC_API.maxAge,
                CacheStrategies.PUBLIC_API.staleWhileRevalidate,
            );

            // Add security headers to cache headers
            for (const [key, value] of securityHeaders.entries()) {
                cacheHeaders.set(key, value);
            }

            if (result.rateLimit) {
                cacheHeaders.set(
                    "X-RateLimit-Remaining",
                    result.rateLimit.remaining.toString(),
                );
                const resetDate = new Date(result.rateLimit.resetTime);
                cacheHeaders.set("X-RateLimit-Reset", resetDate.toUTCString());
            }

            // Return cached response with ETag support
            return handleETaggedResponse(request, responseData, cacheHeaders);
        }
        catch (error) {
            logger.error("Product search error", {
                query: validation.data.q,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            return createApiErrorResponse(error, "Internal server error during product search");
        }
    }

    // Produkte aus Datei lesen
    let products: SimpleProduct[] = [];
    try {
        const file = await fs.readFile("./data/products.json", "utf-8");
        products = JSON.parse(file);
    }
    catch (err) {
        // Fehlerausgabe mit extractErrorMessage
        console.error("[GET /products]", extractErrorMessage(err));
        products = [];
    }
    const headers = getSecurityHeaders();
    return NextResponse.json(products, { status: 200, headers });
}

export async function POST(request: NextRequest) {
    const logger = createRequestLogger(request);
    logger.info("Product creation request received", { method: "POST" });

    // Validate request size and content type
    if (!validateRequestSize(request, 1024 * 10)) {
        // 10KB limit
        logger.warn("Request payload too large", {
            contentLength: request.headers.get("content-length"),
            limit: "10KB",
        });
        return createApiErrorResponse("Request payload too large", "Request too large", 413);
    }

    if (!validateContentType(request, ["application/json"])) {
        logger.warn("Invalid content type", {
            contentType: request.headers.get("content-type"),
            expected: "application/json",
        });
        return createApiErrorResponse("Invalid content type", "Content type must be application/json", 415);
    }

    // Note: Rate limiting handled by Better Auth middleware

    // Validate request body with Zod
    const validation = await validateRequest(
        request,
        RequestSchemas.createProduct,
    );

    if (!validation.success) {
        logger.warn("Invalid product creation data", {
            validationError: validation.error,
        });
        return createApiErrorResponse(validation.error, "Invalid product creation data", 400);
    }

    // TODO: Implement actual product creation logic with validation.data
    const { id, name, quantity, kcal, unit } = validation.data;

    logger.info("Product creation validated", {
        productId: id,
        productName: name,
        quantity,
        kcal,
        unit,
    });

    // Combine security headers with no-cache headers for POST response
    const headers = getSecurityHeaders();
    const noCacheHeaders = createNoCacheHeaders();
    for (const [key, value] of noCacheHeaders.entries()) {
        headers.set(key, value);
    }

    // Produkt in Datei speichern
    let products: SimpleProduct[] = [];
    try {
        const file = await fs.readFile("./data/products.json", "utf-8");
        products = JSON.parse(file);
    }
    catch (err) {
        // Fehlerausgabe mit extractErrorMessage
        console.error("[POST /products]", extractErrorMessage(err));
        products = [];
    }
    const newProduct: SimpleProduct = { id, name, quantity, kcal, unit };
    products.push(newProduct);
    await fs.writeFile("./data/products.json", JSON.stringify(products, null, 2));
    return NextResponse.json(newProduct, { status: 201, headers });
}
