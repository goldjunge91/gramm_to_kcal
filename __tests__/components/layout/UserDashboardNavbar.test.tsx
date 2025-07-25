import { render, screen } from "@testing-library/react";
import { describe, expect } from "vitest";

import { UserDashboardNavbar } from "@/components/layout/UserDashboardNavbar";

describe("userDashboardNavbar", () => {
    it("should render without crashing", () => {
        render(<UserDashboardNavbar />);
    });

    it("should render items when provided", () => {
        const items = [
            { title: "Dashboard", href: "/dashboard" },
            { title: "Settings", href: "/settings" },
        ];

        render(<UserDashboardNavbar items={items} />);

        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();
    });
});
