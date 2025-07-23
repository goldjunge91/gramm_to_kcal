import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { MainNav } from "./main-nav";

describe("MainNav", () => {
    test("should render without crashing", () => {
        render(<MainNav />);
    });

    test("should render CalorieTracker brand", () => {
        render(<MainNav />);
        expect(screen.getByText("CalorieTracker")).toBeInTheDocument();
    });

    test("should render nav items when provided", () => {
        const items = [
            { title: "Dashboard", href: "/dashboard" },
            { title: "Settings", href: "/settings" },
        ];

        render(<MainNav items={items} />);
        
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();
    });
});