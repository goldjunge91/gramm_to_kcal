/**
 * Tests for utility functions
 */
import { describe, it, expect } from "vitest";

import { cn } from "@/lib/utils";

describe("utils", () => {
    describe("cn (className utility)", () => {
        it("should merge class names", () => {
            expect(cn("btn", "btn-primary")).toBe("btn btn-primary");
        });

        it("should handle conditional classes", () => {
            expect(
                cn("btn", true && "btn-primary", false && "btn-secondary"),
            ).toBe("btn btn-primary");
        });

        it("should merge Tailwind classes correctly", () => {
            // tailwind-merge should resolve conflicts
            expect(cn("px-2 py-1 px-3")).toBe("py-1 px-3");
        });

        it("should handle arrays of classes", () => {
            expect(cn(["btn", "btn-primary"], "text-white")).toBe(
                "btn btn-primary text-white",
            );
        });

        it("should handle objects with conditional classes", () => {
            expect(
                cn({
                    btn: true,
                    "btn-primary": true,
                    "btn-disabled": false,
                }),
            ).toBe("btn btn-primary");
        });

        it("should handle empty inputs", () => {
            expect(cn()).toBe("");
            expect(cn("")).toBe("");
            expect(cn(null)).toBe("");
            expect(cn(undefined)).toBe("");
        });

        it("should handle mixed inputs", () => {
            expect(
                cn(
                    "btn",
                    ["btn-primary", "text-white"],
                    { "shadow-lg": true, disabled: false },
                    "rounded",
                ),
            ).toBe("btn btn-primary text-white shadow-lg rounded");
        });

        it("should resolve Tailwind conflicts properly", () => {
            // Test common Tailwind conflict scenarios
            expect(cn("bg-red-500 bg-blue-500")).toBe("bg-blue-500");
            expect(cn("text-sm text-lg")).toBe("text-lg");
            expect(cn("p-4 px-2")).toBe("p-4 px-2");
        });

        it("should handle complex Tailwind class merging", () => {
            expect(
                cn(
                    "bg-red-500 text-white px-4 py-2",
                    "bg-blue-500 px-6",
                    "hover:bg-blue-600",
                ),
            ).toBe("text-white py-2 bg-blue-500 px-6 hover:bg-blue-600");
        });

        it("should preserve non-conflicting classes", () => {
            expect(
                cn(
                    "flex items-center justify-center",
                    "bg-blue-500 text-white",
                    "rounded-lg shadow-md",
                ),
            ).toBe(
                "flex items-center justify-center bg-blue-500 text-white rounded-lg shadow-md",
            );
        });
    });
});
