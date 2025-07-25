import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

import { useCurrentUserName } from "@/hooks/use-current-user-name";
import { useSession } from "@/lib/auth/auth-client";

vi.mock("@/lib/auth/auth-client", () => ({
    useSession: vi.fn(),
}));

const mockUseSession = useSession as unknown as ReturnType<typeof vi.fn>;

it("should return user name when session exists", () => {
    mockUseSession.mockReturnValue({
        data: {
            user: {
                id: "123",
                name: "Jane Doe",
                email: "jane@example.com",
            },
        },
        isPending: false,
        error: null,
        refetch: vi.fn(),
    });

    const { result } = renderHook(() => useCurrentUserName());
    expect(result.current).toBe("Jane Doe");
});

it("should return '?' when session is missing or user name is falsy", () => {
    mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
        error: null,
        refetch: vi.fn(),
    });

    const { result } = renderHook(() => useCurrentUserName());
    expect(result.current).toBe("?");

    mockUseSession.mockReturnValue({
        data: {
            user: {
                id: "123",
                name: "",
                email: "jane@example.com",
            },
        },
        isPending: false,
        error: null,
        refetch: vi.fn(),
    });

    const { result: resultEmptyName } = renderHook(() => useCurrentUserName());
    expect(resultEmptyName.current).toBe("?");
});
