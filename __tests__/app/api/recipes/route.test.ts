/**
 * E2E- und Integrationstest-Template für API-Routen
 * Ziel: Coverage für /app/api/recipes/route.ts
 */
import { describe, expect, it } from "vitest";

import * as recipesApi from "@/app/api/recipes/route";

// Beispiel: GET-Handler testen

describe("[API] /app/api/recipes/route.ts", () => {
    it("should return recipes list (GET)", async () => {
        // Arrange: Request mock
        const req = new Request("http://localhost:3000/api/recipes", { method: "GET" });
        // Act: Handler ausführen
        const res = await recipesApi.GET?.(req);
        // Assert: Response prüfen
        expect(res).toBeDefined();
        expect(res?.status).toBe(200);
        // Inhalt prüfen und ausgeben
        const data = await res?.json();
        // Konsolenausgabe für Debug

        console.log("API Response:", data);
        expect(Array.isArray(data)).toBe(true);
    });

    // Weitere Tests für POST, PUT, DELETE etc. können hier ergänzt werden
});
