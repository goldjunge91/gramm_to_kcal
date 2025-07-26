/**
 * Integrationstest für die API-Route /app/api/recipes/route.ts
 * Testet das Anlegen (POST) und Abrufen (GET) von Rezepten.
 */
import { describe, expect, it } from "vitest";

import * as recipesApi from "@/app/api/recipes/route";

const testRecipe = {
    id: "test-id-1",
    title: "Testrezept",
    description: "Ein Testrezept für Coverage.",
    ingredients: ["Mehl", "Wasser"],
};

describe("[API] /app/api/recipes/route.ts", () => {
    it("should create a new recipe (POST) and return it via GET", async () => {
        // POST: Rezept anlegen
        const postReq = new Request("http://localhost:3000/api/recipes", {
            method: "POST",
            body: JSON.stringify(testRecipe),
            headers: { "Content-Type": "application/json" },
        });
        const postRes = await recipesApi.POST?.(postReq);
        expect(postRes).toBeDefined();
        expect(postRes?.status).toBe(201);
        const created = await postRes?.json();
        expect(created).toMatchObject(testRecipe);

        // GET: Alle Rezepte abrufen
        const getReq = new Request("http://localhost:3000/api/recipes", { method: "GET" });
        const getRes = await recipesApi.GET?.(getReq);
        expect(getRes).toBeDefined();
        expect(getRes?.status).toBe(200);
        const data = await getRes?.json();
        // Konsolenausgabe für Debug

        console.log("API Response after POST:", data);
        expect(Array.isArray(data)).toBe(true);
        expect(data.some((r: any) => r.id === testRecipe.id)).toBe(true);
    });
});
