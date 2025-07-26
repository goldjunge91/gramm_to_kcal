import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { Recipe } from "@/lib/db/schemas";

import { isFileSystemError } from "@/lib/types/errors";
import { toAppError } from "@/lib/utils/error-utils";

const dbPath = path.join(process.cwd(), "data", "recipes.json");

async function readDb(): Promise<Recipe[]> {
    try {
        const data = await fs.readFile(dbPath, "utf8");
        return JSON.parse(data);
    }
    catch (error: unknown) {
        const appError = toAppError(error, "read-recipes-db");

        if (isFileSystemError(appError) && appError.code === "ENOENT") {
            return []; // File doesn't exist, return empty array
        }

        throw appError;
    }
}

async function writeDb(data: Recipe[]): Promise<void> {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf8");
}
// export async function GET(request: Request) {
//     const { searchParams } = new URL(request.url);
//     // z.B. Filter anwenden
// }

export async function GET(_request: Request) {
    const recipes = await readDb();
    return NextResponse.json(recipes);
}

export async function POST(request: Request) {
    const newRecipe = await request.json();
    const recipes = await readDb();
    recipes.push(newRecipe);
    await writeDb(recipes);
    return NextResponse.json(newRecipe, { status: 201 });
}
