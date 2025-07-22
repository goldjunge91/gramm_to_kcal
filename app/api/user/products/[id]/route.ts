import type { NextRequest } from "next/server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schemas";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
    // Get user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const updates = await request.json();
        const { id } = params;

        // Update product
        const [updatedProduct] = await db
            .update(products)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(products.id, id),
                    eq(products.userId, session.user.id),
                ),
            )
            .returning();

        if (!updatedProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(updatedProduct);
    }
    catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
    // Get user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        // Soft delete product
        const [deletedProduct] = await db
            .update(products)
            .set({
                isDeleted: true,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(products.id, id),
                    eq(products.userId, session.user.id),
                ),
            )
            .returning();

        if (!deletedProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Product deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
