"use server";

import { auth } from "@/lib/auth/auth";

/**
 * Server action for password reset (custom implementation)
 * Note: Better Auth doesn't have built-in email reset, so we'll implement basic version
 */
export async function resetPasswordAction(formData: FormData) {
    const email = formData.get("email") as string;

    if (!email) {
        return { success: false, error: "Email is required" };
    }

    try {
        // Note: This is a placeholder - in production you'd implement proper email reset
        // For now, we'll return success but explain that it's not implemented
        console.log("Password reset requested for:", email);

        return {
            success: true,
            message:
                "Password reset is not yet implemented with Better Auth. Please contact support.",
        };
    }
    catch (error) {
        console.error("Password reset error:", error);
        return {
            success: false,
            error: "Password reset failed",
        };
    }
}

/**
 * Server action for updating user password
 * Note: This is a simplified implementation - in production you'd verify the user's current password
 */
export async function updatePasswordAction(formData: FormData) {
    const newPassword = formData.get("password") as string;

    if (!newPassword) {
        return { success: false, error: "New password is required" };
    }

    if (newPassword.length < 8) {
        return {
            success: false,
            error: "Password must be at least 8 characters long",
        };
    }

    try {
        const session = await auth.api.getSession({
            headers: new Headers(),
        });

        if (!session?.user) {
            return { success: false, error: "User not authenticated" };
        }

        // Update user password using Better Auth
        await auth.api.setPassword({
            body: {
                newPassword,
            },
            headers: new Headers(),
        });

        return {
            success: true,
            message: "Password updated successfully",
        };
    }
    catch (error) {
        console.error("Password update error:", error);
        return {
            success: false,
            error: "Password update failed",
        };
    }
}
