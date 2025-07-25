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
    { params }: { params: { id: string } },
) {
    const logger = createRequestLogger(request);

    try {
        // Get user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            logger.warn("Unauthorized product update attempt", { productId: params.id });
            const noCacheHeaders = createNoCacheHeaders();
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: noCacheHeaders },
            );
        }

        const updates = await request.json();
        const { id } = params;

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
            const noCacheHeaders = createNoCacheHeaders();
            return NextResponse.json(
                { error: "Product not found" },
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
            productId: params.id,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        const noCacheHeaders = createNoCacheHeaders();
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: noCacheHeaders },
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    const logger = createRequestLogger(request);

    try {
        // Get user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            logger.warn("Unauthorized product deletion attempt", { productId: params.id });
            const noCacheHeaders = createNoCacheHeaders();
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: noCacheHeaders },
            );
        }

        const { id } = params;

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
            const noCacheHeaders = createNoCacheHeaders();
            return NextResponse.json(
                { error: "Product not found" },
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
            productId: params.id,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        const noCacheHeaders = createNoCacheHeaders();
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: noCacheHeaders },
        );
    }
}
