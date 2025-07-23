import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { MobileNav } from "./MobileNav";

describe("MobileNav", () => {
    test("should render items", () => {
        const items = [
            { title: "Dashboard", href: "/dashboard" },
            { title: "Settings", href: "/settings" },
        ];

        render(<MobileNav items={items} />);
        
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    test("should render CalorieTracker brand", () => {
        const items = [{ title: "Test", href: "/test" }];
        
        render(<MobileNav items={items} />);
        expect(screen.getByText("CalorieTracker")).toBeInTheDocument();
    });
});