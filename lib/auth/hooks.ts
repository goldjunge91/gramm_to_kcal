"use client";

import { useSession } from "@/lib/auth/auth-client";

/**
 * Custom hook to access the current user session on client components.
 *
 * @deprecated Consider using server components with auth() instead.
 * This hook should only be used when you need session data in client components.
 *
 * @returns The session data including user information
 */
export function useCurrentSession() {
    return useSession();
}

/**
 * Custom hook to get the current authenticated user on client components.
 *
 * @returns The current user or null if not authenticated
 */
export function useCurrentUser() {
    const { data: session } = useSession();
    return session?.user ?? null;
}

/**
 * Custom hook to check authentication status on client components.
 *
 * @returns Object with isAuthenticated boolean and isLoading status
 */
export function useAuth() {
    const { data: session, isPending } = useSession();

    return {
        isAuthenticated: !!session?.user,
        isLoading: isPending,
        user: session?.user ?? null,
    };
}

/**
 * Custom hook to check if user has a specific role on client components.
 *
 * @param role - The role to check for
 * @returns Object with hasRole boolean and isLoading status
 */
export function useRole(role: string) {
    const { data: session, isPending } = useSession();

    const userRole = (session?.user as any)?.role;
    const hasRole = userRole === role;

    return {
        hasRole,
        isLoading: isPending,
        userRole,
    };
}
