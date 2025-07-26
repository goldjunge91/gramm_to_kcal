import type { NextRequest } from "next/server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { ingredients, recipes } from "@/lib/db/schemas";
import { createRequestLogger } from "@/lib/utils/logger";

export async function GET(
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
            logger.warn("Unauthorized recipe fetch attempt", { recipeId: id });
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        logger.info("Fetching recipe with ingredients", {
            recipeId: id,
            userId: session.user.id,
        });

        // Get recipe with ingredients
        const recipe = await db
            .select()
            .from(recipes)
            .where(
                and(
                    eq(recipes.id, id),
                    eq(recipes.userId, session.user.id),
                    eq(recipes.isDeleted, false),
                ),
            )
            .limit(1);

        if (recipe.length === 0) {
            logger.warn("Recipe not found", {
                recipeId: id,
                userId: session.user.id,
            });
            return NextResponse.json(
                { error: "Recipe not found" },
                { status: 404 },
            );
        }

        // Get ingredients for this recipe
        const recipeIngredients = await db
            .select()
            .from(ingredients)
            .where(
                and(
                    eq(ingredients.recipeId, id),
                    eq(ingredients.userId, session.user.id),
                    eq(ingredients.isDeleted, false),
                ),
            )
            .orderBy(ingredients.order);

        logger.info("Recipe fetched successfully", {
            recipeId: id,
            userId: session.user.id,
            ingredientCount: recipeIngredients.length,
        });

        return NextResponse.json({
            recipe: recipe[0],
            ingredients: recipeIngredients,
        });
    }
    catch (error) {
        logger.error("Error fetching recipe", {
            recipeId: (await params).id,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

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
            logger.warn("Unauthorized recipe update attempt", { recipeId: id });
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const updates = await request.json();

        logger.info("Updating recipe", {
            recipeId: id,
            userId: session.user.id,
            updateFields: Object.keys(updates),
        });

        // Update recipe
        const [updatedRecipe] = await db
            .update(recipes)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(recipes.id, id),
                    eq(recipes.userId, session.user.id),
                ),
            )
            .returning();

        if (!updatedRecipe) {
            logger.warn("Recipe not found for update", {
                recipeId: id,
                userId: session.user.id,
            });
            return NextResponse.json(
                { error: "Recipe not found" },
                { status: 404 },
            );
        }

        logger.info("Recipe updated successfully", {
            recipeId: id,
            userId: session.user.id,
        });

        return NextResponse.json(updatedRecipe);
    }
    catch (error) {
        logger.error("Error updating recipe", {
            recipeId: (await params).id,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
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
            logger.warn("Unauthorized recipe deletion attempt", { recipeId: id });
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        logger.info("Deleting recipe and associated ingredients", {
            recipeId: id,
            userId: session.user.id,
        });

        // Soft delete recipe and its ingredients
        await db.transaction(async (tx) => {
            // Soft delete recipe
            await tx
                .update(recipes)
                .set({
                    isDeleted: true,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(recipes.id, id),
                        eq(recipes.userId, session.user.id),
                    ),
                );

            // Soft delete associated ingredients
            await tx
                .update(ingredients)
                .set({
                    isDeleted: true,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(ingredients.recipeId, id),
                        eq(ingredients.userId, session.user.id),
                    ),
                );
        });

        logger.info("Recipe and ingredients deleted successfully", {
            recipeId: id,
            userId: session.user.id,
        });

        return NextResponse.json({ message: "Recipe deleted successfully" });
    }
    catch (error) {
        logger.error("Error deleting recipe", {
            recipeId: (await params).id,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
