import { render } from "@testing-library/react";
import { describe, expect } from "vitest";

import { Icons } from "./icons";

describe("icons", () => {
    it("should render icon with name prop", () => {
        const { container } = render(<Icons name="User" />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it("should have logo property", () => {
        expect(Icons.logo).toBeDefined();
    });

    it("should have close property", () => {
        expect(Icons.close).toBeDefined();
    });
});
