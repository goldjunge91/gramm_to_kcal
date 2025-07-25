import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "data", "recipes.json");

async function readDb(): Promise<any[]> {
    try {
        const data = await fs.readFile(dbPath, "utf8");
        return JSON.parse(data);
    }
    catch (error: any) {
        if (error.code === "ENOENT") {
            return [];
        }
        throw error;
    }
}

async function writeDb(data: any[]): Promise<void> {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf8");
}

export async function GET() {
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
