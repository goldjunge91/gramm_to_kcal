import type { NextRequest } from "next/server";

import { and, desc, eq, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { ingredients, recipes } from "@/lib/db/schemas";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        // Get user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { id: recipeId } = params;

        // Verify recipe exists and belongs to user
        const recipe = await db
            .select()
            .from(recipes)
            .where(
                and(
                    eq(recipes.id, recipeId),
                    eq(recipes.userId, session.user.id),
                    eq(recipes.isDeleted, false),
                ),
            )
            .limit(1);

        if (recipe.length === 0) {
            return NextResponse.json(
                { error: "Recipe not found" },
                { status: 404 },
            );
        }

        // Parse pagination parameters
        const url = new URL(request.url);
        const cursor = url.searchParams.get("cursor"); // ISO timestamp for cursor-based pagination
        const limit = Math.min(
            Math.max(Number.parseInt(url.searchParams.get("limit") || "20", 10), 1),
            100, // Max 100 ingredients per page
        );

        // Build query with cursor-based pagination
        const query = db
            .select()
            .from(ingredients)
            .where(
                and(
                    eq(ingredients.recipeId, recipeId),
                    eq(ingredients.userId, session.user.id),
                    eq(ingredients.isDeleted, false),
                    // Add cursor condition if provided (fetch items older than cursor)
                    cursor ? lt(ingredients.createdAt, new Date(cursor)) : undefined,
                ),
            )
            .orderBy(desc(ingredients.createdAt))
            .limit(limit);

        const recipeIngredients = await query;

        // Generate next cursor from last item
        const nextCursor = recipeIngredients.length === limit && recipeIngredients.length > 0
            ? recipeIngredients[recipeIngredients.length - 1].createdAt.toISOString()
            : null;

        // Generate ETag for cache validation based on data content
        const responseData = {
            ingredients: recipeIngredients,
            pagination: {
                limit,
                cursor: cursor || null,
                nextCursor,
                hasMore: nextCursor !== null,
                count: recipeIngredients.length,
            },
        };

        const etag = createHash("md5")
            .update(JSON.stringify(responseData))
            .digest("hex");

        // Check if client has cached version
        const clientETag = request.headers.get("if-none-match");
        if (clientETag === etag) {
            return new NextResponse(null, {
                status: 304,
                headers: {
                    "ETag": etag,
                    "Cache-Control": "private, max-age=60, must-revalidate",
                },
            });
        }

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
        console.error("Error fetching ingredients:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        // Get user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { id: recipeId } = params;

        // Verify recipe exists and belongs to user
        const recipe = await db
            .select()
            .from(recipes)
            .where(
                and(
                    eq(recipes.id, recipeId),
                    eq(recipes.userId, session.user.id),
                    eq(recipes.isDeleted, false),
                ),
            )
            .limit(1);

        if (recipe.length === 0) {
            return NextResponse.json(
                { error: "Recipe not found" },
                { status: 404 },
            );
        }

        const ingredientData = await request.json();

        // Insert new ingredient
        const inserted = await db
            .insert(ingredients)
            .values({
                ...ingredientData,
                recipeId,
                userId: session.user.id,
                id: crypto.randomUUID(),
                version: 1,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        if (inserted.length === 0) {
            return NextResponse.json(
                { error: "Failed to create ingredient" },
                { status: 500 },
            );
        }

        const newIngredient = inserted[0];

        return NextResponse.json(newIngredient, { status: 201 });
    }
    catch (error) {
        console.error("Error creating ingredient:", error);
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
