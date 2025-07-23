import type { NextRequest } from "next/server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

        const { id } = params;

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

        return NextResponse.json({
            recipe: recipe[0],
            ingredients: recipeIngredients,
        });
    }
    catch (error) {
        console.error("Error fetching recipe:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

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
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const updates = await request.json();
        const { id } = params;

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
            return NextResponse.json(
                { error: "Recipe not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(updatedRecipe);
    }
    catch (error) {
        console.error("Error updating recipe:", error);
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
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { id } = params;

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

        return NextResponse.json({ message: "Recipe deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting recipe:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
