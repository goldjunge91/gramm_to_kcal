import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Icons } from "./icons";

describe("Icons", () => {
    test("should render icon with name prop", () => {
        const { container } = render(<Icons name="Home" />);
        expect(container.firstChild).toBeInTheDocument();
    });

    test("should have logo property", () => {
        expect(Icons.logo).toBeDefined();
    });

    test("should have close property", () => {
        expect(Icons.close).toBeDefined();
    });
});