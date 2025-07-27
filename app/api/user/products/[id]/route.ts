import type { NextRequest } from "next/server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schemas";
import { createNoCacheHeaders } from "@/lib/utils/cache-headers";
import { createRequestLogger } from "@/lib/utils/logger";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const logger = createRequestLogger(request);

    try {
        // Await params in Next.js 15
        const { id } = await params;

        // Get user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            logger.warn("Unauthorized product update attempt", { productId: id });
            // Create auth error for standardized response
            const authError = {
                type: "AUTH_ERROR" as const,
                message: "Unauthorized",
            };
            const noCacheHeaders = createNoCacheHeaders();
            return NextResponse.json(
                { success: false, error: authError },
                { status: 401, headers: noCacheHeaders },
            );
        }

        const updates = await request.json();

        logger.info("Updating product", {
            productId: id,
            userId: session.user.id,
            updateFields: Object.keys(updates),
        });

        // Update product
        const [updatedProduct] = await db
            .update(products)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(
                and(eq(products.id, id), eq(products.userId, session.user.id)),
            )
            .returning();

        if (!updatedProduct) {
            logger.warn("Product not found for update", {
                productId: id,
                userId: session.user.id,
            });
            // Create not found error for standardized response
            const notFoundError = {
                type: "NOT_FOUND_ERROR" as const,
                message: "Product not found",
            };
            const noCacheHeaders = createNoCacheHeaders();
            return NextResponse.json(
                { success: false, error: notFoundError },
                { status: 404, headers: noCacheHeaders },
            );
        }

        logger.info("Product updated successfully", {
            productId: id,
            userId: session.user.id,
        });

        // Add no-cache headers to prevent caching of mutation responses
        const noCacheHeaders = createNoCacheHeaders();
        return NextResponse.json(updatedProduct, { headers: noCacheHeaders });
    }
    catch (error) {
        logger.error("Error updating product", {
            productId: (await params).id,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        // Fallback-Logging für Tests
        if (typeof console !== "undefined" && typeof console.error === "function") {
            console.error("Error updating product:", error);
        }
        // Create internal error for standardized response
        const internalError = {
            type: "INTERNAL_ERROR" as const,
            message: error instanceof Error ? error.message : "Internal server error",
        };
        const noCacheHeaders = createNoCacheHeaders();
        return NextResponse.json(
            { success: false, error: internalError },
            { status: 500, headers: noCacheHeaders },
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const logger = createRequestLogger(request);

    try {
        // Await params in Next.js 15
        const { id } = await params;

        // Get user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            logger.warn("Unauthorized product deletion attempt", { productId: id });
            // Create auth error for standardized response
            const authError = {
                type: "AUTH_ERROR" as const,
                message: "Unauthorized",
            };
            const noCacheHeaders = createNoCacheHeaders();
            return NextResponse.json(
                { success: false, error: authError },
                { status: 401, headers: noCacheHeaders },
            );
        }

        logger.info("Deleting product", {
            productId: id,
            userId: session.user.id,
        });

        // Soft delete product
        const [deletedProduct] = await db
            .update(products)
            .set({
                isDeleted: true,
                updatedAt: new Date(),
            })
            .where(
                and(eq(products.id, id), eq(products.userId, session.user.id)),
            )
            .returning();

        if (!deletedProduct) {
            logger.warn("Product not found for deletion", {
                productId: id,
                userId: session.user.id,
            });
            // Create not found error for standardized response
            const notFoundError = {
                type: "NOT_FOUND_ERROR" as const,
                message: "Product not found",
            };
            const noCacheHeaders = createNoCacheHeaders();
            return NextResponse.json(
                { success: false, error: notFoundError },
                { status: 404, headers: noCacheHeaders },
            );
        }

        logger.info("Product deleted successfully", {
            productId: id,
            userId: session.user.id,
        });

        // Add no-cache headers to prevent caching of mutation responses
        const noCacheHeaders = createNoCacheHeaders();
        return NextResponse.json(
            { message: "Product deleted successfully" },
            { headers: noCacheHeaders },
        );
    }
    catch (error) {
        logger.error("Error deleting product", {
            productId: (await params).id,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        // Fallback-Logging für Tests
        if (typeof console !== "undefined" && typeof console.error === "function") {
            console.error("Error deleting product:", error);
        }
        // Create internal error for standardized response
        const internalError = {
            type: "INTERNAL_ERROR" as const,
            message: error instanceof Error ? error.message : "Internal server error",
        };
        const noCacheHeaders = createNoCacheHeaders();
        return NextResponse.json(
            { success: false, error: internalError },
            { status: 500, headers: noCacheHeaders },
        );
    }
}
