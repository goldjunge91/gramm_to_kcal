import { describe, expect, test } from "vitest";

import { dashboardConfig } from "./dashboard";

describe("dashboardConfig", () => {
    test("should have mainNav items", () => {
        expect(dashboardConfig.mainNav).toBeDefined();
        expect(Array.isArray(dashboardConfig.mainNav)).toBe(true);
    });

    test("should have sidebarNav items", () => {
        expect(dashboardConfig.sidebarNav).toBeDefined();
        expect(Array.isArray(dashboardConfig.sidebarNav)).toBe(true);
    });

    test("each mainNav item should have required properties", () => {
        dashboardConfig.mainNav.forEach(item => {
            expect(item.title).toBeDefined();
            expect(typeof item.title).toBe("string");
        });
    });

    test("each sidebarNav item should have required properties", () => {
        dashboardConfig.sidebarNav.forEach(item => {
            expect(item.title).toBeDefined();
            expect(typeof item.title).toBe("string");
            expect(item.icon).toBeDefined();
        });
    });
});