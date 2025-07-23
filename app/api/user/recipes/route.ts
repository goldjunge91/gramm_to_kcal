import type { NextRequest } from "next/server";

import { and, desc, eq, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schemas";

export async function GET(request: NextRequest) {
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

        // Parse pagination parameters
        const url = new URL(request.url);
        const cursor = url.searchParams.get("cursor"); // ISO timestamp for cursor-based pagination
        const limit = Math.min(
            Math.max(Number.parseInt(url.searchParams.get("limit") || "20", 10), 1),
            50, // Max 50 items per page
        );

        // Build query with cursor-based pagination
        const query = db
            .select()
            .from(recipes)
            .where(
                and(
                    eq(recipes.userId, session.user.id),
                    eq(recipes.isDeleted, false),
                    // Add cursor condition if provided (fetch items older than cursor)
                    cursor ? lt(recipes.createdAt, new Date(cursor)) : undefined,
                ),
            )
            .orderBy(desc(recipes.createdAt))
            .limit(limit);

        const userRecipes = await query;

        // Generate next cursor from last item
        const nextCursor = userRecipes.length === limit && userRecipes.length > 0
            ? userRecipes[userRecipes.length - 1].createdAt.toISOString()
            : null;

        // Generate ETag for cache validation based on data content
        const responseData = {
            recipes: userRecipes,
            pagination: {
                limit,
                cursor: cursor || null,
                nextCursor,
                hasMore: nextCursor !== null,
                count: userRecipes.length,
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
        console.error("Error fetching recipes:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
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

        const recipeData = await request.json();

        // Insert new recipe
        const inserted = await db
            .insert(recipes)
            .values({
                ...recipeData,
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
                { error: "Failed to create recipe" },
                { status: 500 },
            );
        }

        const newRecipe = inserted[0];

        return NextResponse.json(newRecipe, { status: 201 });
    }
    catch (error) {
        console.error("Error creating recipe:", error);
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
