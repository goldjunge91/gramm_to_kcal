import type { NextRequest } from "next/server";

import { and, desc, eq, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schemas";
import { createRequestLogger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
    const logger = createRequestLogger(request);

    try {
        // Get user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            logger.warn("Unauthorized products fetch attempt");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // Parse pagination parameters
        const url = new URL(request.url);
        const cursor = url.searchParams.get("cursor"); // ISO timestamp for cursor-based pagination
        const limit = Math.min(
            Math.max(Number.parseInt(url.searchParams.get("limit") || "20", 10), 1),
            50, // Max 50 items per page
        );

        logger.info("Fetching user products", {
            userId: session.user.id,
            cursor,
            limit,
        });

        // Build query with cursor-based pagination
        const query = db
            .select()
            .from(products)
            .where(
                and(
                    eq(products.userId, session.user.id),
                    eq(products.isDeleted, false),
                    // Add cursor condition if provided (fetch items older than cursor)
                    cursor ? lt(products.createdAt, new Date(cursor)) : undefined,
                ),
            )
            .orderBy(desc(products.createdAt))
            .limit(limit);

        const userProducts = await query;

        // Generate next cursor from last item
        const nextCursor = userProducts.length === limit && userProducts.length > 0
            ? userProducts[userProducts.length - 1].createdAt.toISOString()
            : null;

        // Generate ETag for cache validation based on data content
        const responseData = {
            products: userProducts,
            pagination: {
                limit,
                cursor: cursor || null,
                nextCursor,
                hasMore: nextCursor !== null,
                count: userProducts.length,
            },
        };

        const etag = createHash("md5")
            .update(JSON.stringify(responseData))
            .digest("hex");

        // Check if client has cached version
        const clientETag = request.headers.get("if-none-match");
        if (clientETag === etag) {
            logger.debug("Returning cached response (304)", {
                userId: session.user.id,
                etag,
                clientETag,
            });
            return new NextResponse(null, {
                status: 304,
                headers: {
                    "ETag": etag,
                    "Cache-Control": "private, max-age=60, must-revalidate",
                },
            });
        }

        logger.info("Products fetched successfully", {
            userId: session.user.id,
            productCount: userProducts.length,
            hasMore: nextCursor !== null,
            etag,
        });

        // Return data with caching headers
        return NextResponse.json(responseData, {
            headers: {
                "ETag": etag,
                "Cache-Control": "private, max-age=60, must-revalidate", // Cache for 1 minute
                "Vary": "Authorization", // Cache varies by user auth
            },
        });
    }
    catch (error) {
        logger.error("Error fetching products", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        // Fallback-Logging für Tests
        if (typeof console !== "undefined" && typeof console.error === "function") {
            console.error("Error fetching products:", error);
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    const logger = createRequestLogger(request);

    try {
        // Get user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            logger.warn("Unauthorized product creation attempt");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const productData = await request.json();

        logger.info("Creating new product", {
            userId: session.user.id,
            productName: productData.name,
            productFields: Object.keys(productData),
        });

        // Insert new product
        const inserted = await db
            .insert(products)
            .values({
                ...productData,
                userId: session.user.id,
                id: crypto.randomUUID(),
                version: 1,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        if (inserted.length === 0) {
            logger.error("Failed to insert product - no data returned", {
                userId: session.user.id,
                productData,
            });
            // Fallback-Logging für Tests
            if (typeof console !== "undefined" && typeof console.error === "function") {
                console.error("Failed to insert product, no data returned.");
            }
            return NextResponse.json(
                { error: "Failed to create product" },
                { status: 500 },
            );
        }

        const newProduct = inserted[0];

        logger.info("Product created successfully", {
            userId: session.user.id,
            productId: newProduct.id,
            productName: newProduct.name,
        });

        return NextResponse.json(newProduct, { status: 201 });
    }
    catch (error) {
        logger.error("Error creating product", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            details: error instanceof Error ? error.message : "Unknown error",
        });
        return NextResponse.json(
            {
                error: "Internal server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
