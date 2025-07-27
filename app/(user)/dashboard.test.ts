import { describe, expect } from "vitest";

import { dashboardConfig } from "@/app/(user)/dashboard";

describe("dashboardConfig", () => {
    it("should have mainNav items", () => {
        expect(dashboardConfig.mainNav).toBeDefined();
        expect(Array.isArray(dashboardConfig.mainNav)).toBe(true);
    });

    it("should have sidebarNav items", () => {
        expect(dashboardConfig.sidebarNav).toBeDefined();
        expect(Array.isArray(dashboardConfig.sidebarNav)).toBe(true);
    });

    it("each mainNav item should have required properties", () => {
        dashboardConfig.mainNav.forEach((item) => {
            expect(item.title).toBeDefined();
            expect(typeof item.title).toBe("string");
        });
    });

    it("each sidebarNav item should have required properties", () => {
        dashboardConfig.sidebarNav.forEach((item) => {
            expect(item.title).toBeDefined();
            expect(typeof item.title).toBe("string");
            expect(item.icon).toBeDefined();
        });
    });
});
