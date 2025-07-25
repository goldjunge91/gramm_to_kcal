import type { NextRequest } from "next/server";

import { and, desc, eq, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schemas";
import { createRequestLogger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
    const logger = createRequestLogger(request);

    try {
        // Get user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            logger.warn("Unauthorized recipes fetch attempt");
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

        logger.info("Fetching user recipes", {
            userId: session.user.id,
            cursor,
            limit,
        });

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
            logger.debug("Returning cached recipes response (304)", {
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

        logger.info("Recipes fetched successfully", {
            userId: session.user.id,
            recipeCount: userRecipes.length,
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
        logger.error("Error fetching recipes", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
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
            logger.warn("Unauthorized recipe creation attempt");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const recipeData = await request.json();

        logger.info("Creating new recipe", {
            userId: session.user.id,
            recipeName: recipeData.name,
            recipeFields: Object.keys(recipeData),
        });

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
            logger.error("Failed to insert recipe - no data returned", {
                userId: session.user.id,
                recipeData,
            });
            return NextResponse.json(
                { error: "Failed to create recipe" },
                { status: 500 },
            );
        }

        const newRecipe = inserted[0];

        logger.info("Recipe created successfully", {
            userId: session.user.id,
            recipeId: newRecipe.id,
            recipeName: newRecipe.name,
        });

        return NextResponse.json(newRecipe, { status: 201 });
    }
    catch (error) {
        logger.error("Error creating recipe", {
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
