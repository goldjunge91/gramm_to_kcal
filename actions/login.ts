"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { REDIRECT_PATHS } from "@/lib/auth/routes";

// Validation schema for login
const signInSchema = z.object({
    email: z
        .string()
        .email("Invalid email address")
        .min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
});

// Audit logging helper
function logAuthAttempt(
    type: "signin",
    email: string,
    success: boolean,
    error?: string,
) {
    console.log(
        `[BETTER_AUTH] ${type.toUpperCase()} - ${email} - ${success ? "SUCCESS" : "FAILED"}${error ? ` - ${error}` : ""}`,
    );
}

/**
 * Server action for Better Auth login
 */
export async function loginAction(formData: FormData) {
    const rawData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    // Input validation with Zod
    const validation = signInSchema.safeParse(rawData);
    if (!validation.success) {
        const errorMessage
            = validation.error.issues[0]?.message || "Invalid input";
        logAuthAttempt(
            "signin",
            rawData.email || "unknown",
            false,
            errorMessage,
        );
        redirect(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
    }

    const { email, password } = validation.data;

    try {
        const result = await auth.api.signInEmail({
            body: {
                email,
                password,
            },
        });

        if (!result.user) {
            logAuthAttempt("signin", email, false, "Invalid credentials");
            redirect(
                `/auth/login?error=${encodeURIComponent("Invalid email or password")}`,
            );
        }

        logAuthAttempt("signin", email, true);

        // Revalidate layout to update auth state
        revalidatePath("/", "layout");

        // Redirect to main app
        redirect(REDIRECT_PATHS.DEFAULT_AFTER_LOGIN);
    }
    catch (error) {
        const errorMsg
            = error instanceof Error ? error.message : "Unexpected error";
        logAuthAttempt("signin", email, false, errorMsg);
        redirect(
            `/auth/login?error=${encodeURIComponent("Login failed. Please try again.")}`,
        );
    }
}
