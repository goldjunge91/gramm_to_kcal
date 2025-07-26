import { NextRequest } from "next/server";
/**
 * Integrationstest für die API-Route /app/api/products/route.ts
 * Testet das Anlegen (POST) und Abrufen (GET) von Produkten.
 */
import { describe, expect, it } from "vitest";

import * as productsApi from "@/app/api/products/route";

const testProduct = {
    id: "test-prod-1",
    name: "Testprodukt",
    kcal: 123,
    unit: "g",
    quantity: 1,
};

describe("[API] /app/api/products/route.ts", () => {
    it("should create a new product (POST) and return it via GET", async () => {
        // POST: Produkt anlegen
        const postReq = new NextRequest("http://localhost:3000/api/products", {
            method: "POST",
            body: JSON.stringify(testProduct),
            headers: { "Content-Type": "application/json" },
        });
        const postRes = await productsApi.POST?.(postReq);
        expect(postRes).toBeDefined();
        expect(postRes?.status).toBe(201);
        const created = await postRes?.json();
        expect(created).toMatchObject(testProduct);

        // GET: Alle Produkte abrufen
        const getReq = new NextRequest("http://localhost:3000/api/products", { method: "GET" });
        const getRes = await productsApi.GET?.(getReq);
        expect(getRes).toBeDefined();
        expect(getRes?.status).toBe(200);
        const data = await getRes?.json();
        // Konsolenausgabe für Debug
        console.log("API Response after POST:", data);
        expect(Array.isArray(data)).toBe(true);
        expect(data.some((p: any) => p.id === testProduct.id)).toBe(true);
    });
});
