/**
 * Test: Google OAuth Image Loading
 * TDD Red Phase - Test that Google profile images load correctly
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CurrentUserAvatar } from "@/components/auth/current-user-avatar";

// Mock the AvatarImage component to render a simple img tag
vi.mock("@/components/ui/avatar", async () => {
    const actual = await vi.importActual("@/components/ui/avatar");
    return {
        ...actual,
        AvatarImage: (props: any) => <img {...props} />,
    };
});

// Mock the auth hooks
vi.mock("@/hooks/use-current-user-image", () => ({
    useCurrentUserImage: vi.fn(),
}));

vi.mock("@/hooks/use-current-user-name", () => ({
    useCurrentUserName: vi.fn(),
}));

describe("google OAuth Image Loading", () => {
    it("should display Google profile image when available", async () => {
        const { useCurrentUserImage } = await import("@/hooks/use-current-user-image");
        const { useCurrentUserName } = await import("@/hooks/use-current-user-name");

        // Mock Google profile image URL
        const googleImageUrl = "https://lh3.googleusercontent.com/a-/AOh14Gh_test_image_url";

        vi.mocked(useCurrentUserImage).mockReturnValue(googleImageUrl);
        vi.mocked(useCurrentUserName).mockReturnValue("John Doe");

        render(<CurrentUserAvatar />);

        // Should render image with correct src
        const avatarImage = await screen.findByRole("img");
        expect(avatarImage).toHaveAttribute("src", googleImageUrl);
        expect(avatarImage).toHaveAttribute("alt", "JD");
    });

    it("should show fallback initials when image fails to load", async () => {
        const { useCurrentUserImage } = await import("@/hooks/use-current-user-image");
        const { useCurrentUserName } = await import("@/hooks/use-current-user-name");

        vi.mocked(useCurrentUserImage).mockReturnValue(null);
        vi.mocked(useCurrentUserName).mockReturnValue("John Doe");

        render(<CurrentUserAvatar />);

        // Should show fallback with initials
        expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("should handle Google lh3 domain specifically", async () => {
        const { useCurrentUserImage } = await import("@/hooks/use-current-user-image");
        const { useCurrentUserName } = await import("@/hooks/use-current-user-name");

        const googleImageUrl = "https://lh3.googleusercontent.com/a-/AOh14Gh_test_specific";

        vi.mocked(useCurrentUserImage).mockReturnValue(googleImageUrl);
        vi.mocked(useCurrentUserName).mockReturnValue("Test User");

        render(<CurrentUserAvatar />);

        const avatarImage = await screen.findByRole("img");
        expect(avatarImage).toHaveAttribute("src", googleImageUrl);
    });
});
