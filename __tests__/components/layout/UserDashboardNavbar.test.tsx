import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { UserDashboardNavbar } from "@/components/layout/UserDashboardNavbar";

describe("UserDashboardNavbar", () => {
    test("should render without crashing", () => {
        render(<UserDashboardNavbar />);
    });

    test("should render items when provided", () => {
        const items = [
            { title: "Dashboard", href: "/dashboard" },
            { title: "Settings", href: "/settings" },
        ];

        render(<UserDashboardNavbar items={items} />);
        
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();
    });
});