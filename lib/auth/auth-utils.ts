import "server-only";

import { auth } from "@/lib/auth/auth";
import { createLogger } from "@/lib/utils/logger";

/**
 * Retrieves the current user from session in server components
 *
 * @serverOnly This function can only be used in server components or server-side code
 * @returns The current user or null if not authenticated
 */
export async function currentSessionUser() {
    try {
        const session = await auth.api.getSession({
            headers: new Headers(),
        });

        if (!session?.user) {
            return null;
        }

        return session.user;
    }
    catch (error) {
        const logger = createLogger();
        logger.error("Error getting current session user", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return null;
    }
}

/**
 * Check if the current user has a specific role
 *
 * @serverOnly This function can only be used in server components or server-side code
 * @param role - The role to check for
 * @returns True if user has the role, false otherwise
 */
export async function sessionHasRole(role: string): Promise<boolean> {
    try {
        const session = await auth.api.getSession({
            headers: new Headers(),
        });

        if (!session?.user) {
            return false;
        }

        // Better Auth typically stores roles in user.role or user.roles
        // Check for admin plugin role structure
        const userRole = (session.user as any).role;
        return userRole === role;
    }
    catch (error) {
        const logger = createLogger();
        logger.error("Error checking user role", {
            role,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return false;
    }
}

/**
 * Requires authentication - throws if user is not authenticated
 *
 * @serverOnly This function can only be used in server components or server-side code
 * @returns The authenticated user
 * @throws {Error} If user is not authenticated
 */
export async function requireAuth() {
    const user = await currentSessionUser();

    if (!user) {
        throw new Error("Authentication required");
    }

    return user;
}

/**
 * Requires a specific role - throws if user doesn't have the role
 *
 * @serverOnly This function can only be used in server components or server-side code
 * @param role - The required role
 * @returns The authenticated user
 * @throws {Error} If user is not authenticated or doesn't have the role
 */
export async function requireRole(role: string) {
    const user = await requireAuth();
    const hasRole = await sessionHasRole(role);

    if (!hasRole) {
        throw new Error(`Role '${role}' required`);
    }

    return user;
}
