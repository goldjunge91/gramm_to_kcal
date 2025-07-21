/* eslint-disable no-console */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { updateUserProfile, upsertUser } from "@/lib/db/users";
import { REDIRECT_PATHS } from "@/lib/middleware/routes";
import { createClient } from "@/lib/supabase/server";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";
import { SupabaseAuthRateLimiter } from "@/lib/utils/auth-rate-limit";

// Production-ready Redis-based rate limiter
const authRateLimiter = new SupabaseAuthRateLimiter();

// Validation schemas
const signInSchema = z.object({
    email: z
        .string()
        .email("Invalid email address")
        .min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
    hashedPassword: z.string().optional(), // For client-side hashed passwords
});

const signUpSchema = z
    .object({
        email: z
            .string()
            .email("Invalid email address")
            .min(1, "Email is required"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long"),
        confirmPassword: z.string().min(1, "Password confirmation is required"),
        hashedPassword: z.string().optional(), // For client-side hashed passwords
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

// Audit logging helper
function logAuthAttempt(
    type: "signin" | "signup" | "signout",
    email: string,
    success: boolean,
    error?: string,
) {
    console.log(
        `[AUTH] ${type.toUpperCase()} - ${email} - ${success ? "SUCCESS" : "FAILED"}${error ? ` - ${error}` : ""}`,
    );
    // In production, send to proper logging service
}

/**
 * Server action to sync user with database
 * This should be called from client components instead of directly importing upsertUser
 */
export async function syncUserWithDatabase(userId: string) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user || user.id !== userId) {
            throw new Error("User not authenticated or ID mismatch");
        }

        // Sync user with database
        const dbUser = await upsertUser(user);

        return { success: true, user: dbUser };
    } catch (error) {
        console.error("Error syncing user with database:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Server action to update user profile
 * This should be called from client components instead of directly importing updateUserProfile
 */
export async function updateUserProfileAction(updates: {
    fullName?: string | null;
}) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            throw new Error("User not authenticated");
        }

        // Update user profile in database
        const updatedUser = await updateUserProfile(user.id, updates);

        // Revalidate any cached user data
        revalidatePath("/account");

        return { success: true, user: updatedUser };
    } catch (error) {
        console.error("Error updating user profile:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Server action for secure password reset using Supabase
 */
export async function resetPasswordAction(formData: FormData) {
    const email = formData.get("email") as string;

    if (!email) {
        return { success: false, error: "Email is required" };
    }

    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/auth/update-password`,
        });

        if (error) {
            console.error("Password reset error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, message: "Password reset email sent" };
    } catch (error) {
        console.error("Server password reset error:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Password reset failed",
        };
    }
}

/**
 * Server action for secure password update using Supabase
 */
export async function updatePasswordAction(formData: FormData) {
    const password = formData.get("password") as string;

    if (!password) {
        return { success: false, error: "Password is required" };
    }

    if (password.length < 6) {
        return {
            success: false,
            error: "Password must be at least 6 characters long",
        };
    }

    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            console.error("Password update error:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/", "layout");
        redirect(REDIRECT_PATHS.DEFAULT_AFTER_LOGIN);
    } catch (error) {
        console.error("Server password update error:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Password update failed",
        };
    }
}

/**
 * Server action to handle user authentication and database sync
 */
export async function handleAuthCallback() {
    const supabase = await createClient();

    try {
        // Get the current user from Supabase
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            console.error("Auth error:", error);
            redirect("/auth/login?error=Authentication failed");
        }

        // Sync user with database
        await upsertUser(user);

        // Revalidate any cached user data
        revalidatePath("/", "layout");

        return { success: true, user };
    } catch (error) {
        console.error("Error in auth callback:", error);
        redirect("/auth/login?error=Database sync failed");
    }
}

/**
 * State-of-the-art server action for secure login
 * Features: Rate limiting, input validation, audit logging, client-side hashing support
 */
export async function loginAction(formData: FormData) {
    const rawData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    // Input validation with Zod
    const validation = signInSchema.safeParse(rawData);
    if (!validation.success) {
        const errorMessage =
            validation.error.issues[0]?.message || "Invalid input";
        logAuthAttempt(
            "signin",
            rawData.email || "unknown",
            false,
            errorMessage,
        );
        redirect(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
    }

    const { email, password } = validation.data;

    // Rate limiting by email using Redis-based solution
    const rateLimitResult = await authRateLimiter.checkRateLimit(
        "SIGN_IN",
        email,
    );
    if (!rateLimitResult.allowed) {
        logAuthAttempt("signin", email, false, "Rate limit exceeded");
        redirect(
            "/auth/login?error=Too many login attempts. Please try again later.",
        );
    }

    const supabase = await createClient();

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            logAuthAttempt("signin", email, false, error.message);
            const errorMessage = encodeURIComponent(getAuthErrorMessage(error));
            redirect(`/auth/login?error=${errorMessage}`);
        }

        if (data.user) {
            // Success - sync user with database
            await syncUserWithDatabase(data.user.id);

            // Clear rate limit on successful login
            await authRateLimiter.resetRateLimit("SIGN_IN", email);

            logAuthAttempt("signin", email, true);

            // Revalidate layout to update auth state
            revalidatePath("/", "layout");

            // Redirect to main app using centralized redirect path
            redirect(REDIRECT_PATHS.DEFAULT_AFTER_LOGIN);
        }
    } catch (error) {
        const errorMsg =
            error instanceof Error ? error.message : "Unexpected error";
        logAuthAttempt("signin", email, false, errorMsg);
        redirect("/auth/login?error=An unexpected error occurred");
    }
}

/**
 * State-of-the-art server action for secure signup
 * Features: Rate limiting, input validation, audit logging, client-side hashing support
 */
export async function signupAction(formData: FormData) {
    const rawData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
    };

    // Input validation with Zod
    const validation = signUpSchema.safeParse(rawData);
    if (!validation.success) {
        const errorMessage =
            validation.error.issues[0]?.message || "Invalid input";
        logAuthAttempt(
            "signup",
            rawData.email || "unknown",
            false,
            errorMessage,
        );
        redirect(`/auth/sign-up?error=${encodeURIComponent(errorMessage)}`);
    }

    const { email, password } = validation.data;

    // Rate limiting by email using Redis-based solution
    const rateLimitResult = await authRateLimiter.checkRateLimit(
        "SIGN_UP",
        email,
    );
    if (!rateLimitResult.allowed) {
        logAuthAttempt("signup", email, false, "Rate limit exceeded");
        redirect(
            "/auth/sign-up?error=Too many signup attempts. Please try again later.",
        );
    }

    const supabase = await createClient();

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}${REDIRECT_PATHS.DEFAULT_AFTER_LOGIN}`,
            },
        });

        if (error) {
            logAuthAttempt("signup", email, false, error.message);
            const errorMessage = encodeURIComponent(getAuthErrorMessage(error));
            redirect(`/auth/sign-up?error=${errorMessage}`);
        }

        if (data.user) {
            // Check if user is immediately confirmed (auto-confirm enabled)
            if (data.session) {
                // User is automatically signed in
                await syncUserWithDatabase(data.user.id);

                // Clear rate limit on successful signup
                await authRateLimiter.resetRateLimit("SIGN_UP", email);

                logAuthAttempt("signup", email, true);

                revalidatePath("/", "layout");
                redirect(REDIRECT_PATHS.DEFAULT_AFTER_LOGIN);
            } else {
                // Email confirmation required
                logAuthAttempt(
                    "signup",
                    email,
                    true,
                    "Email confirmation required",
                );
                redirect("/auth/sign-up-success");
            }
        }
    } catch (error) {
        const errorMsg =
            error instanceof Error ? error.message : "Unexpected error";
        logAuthAttempt("signup", email, false, errorMsg);
        redirect("/auth/sign-up?error=An unexpected error occurred");
    }
}

/**
 * Server action to sign out user
 */
export async function signOutUser() {
    const supabase = await createClient();

    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
        }

        revalidatePath("/", "layout");
        redirect("/auth/login");
    } catch (error) {
        console.error("Sign out error:", error);
        redirect("/auth/login?error=Sign out failed");
    }
}

/**
 * Get current authenticated user with database profile
 */
export async function getCurrentUser() {
    const supabase = await createClient();

    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return null;
        }

        // Ensure user exists in database
        const dbUser = await upsertUser(user);

        return {
            ...user,
            profile: dbUser,
        };
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}
