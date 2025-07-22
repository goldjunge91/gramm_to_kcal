"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { REDIRECT_PATHS } from "@/lib/auth/routes";

// Validation schema for registration
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
        name: z.string().min(1, "Name is required"),
    })
    .refine(data => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

// Audit logging helper
function logAuthAttempt(
    type: "signup",
    email: string,
    success: boolean,
    error?: string,
) {
    console.log(
        `[BETTER_AUTH] ${type.toUpperCase()} - ${email} - ${success ? "SUCCESS" : "FAILED"}${error ? ` - ${error}` : ""}`,
    );
}

/**
 * Server action for Better Auth signup
 */
export async function signupAction(formData: FormData) {
    const rawData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
        name: formData.get("name") as string,
    };

    // Input validation with Zod
    const validation = signUpSchema.safeParse(rawData);
    if (!validation.success) {
        const errorMessage = validation.error.issues[0]?.message || "Invalid input";
        logAuthAttempt("signup", rawData.email || "unknown", false, errorMessage);
        redirect(`/auth/sign-up?error=${encodeURIComponent(errorMessage)}`);
    }

    const { email, password, name } = validation.data;

    try {
        const result = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            },
        });

        if (!result.user) {
            logAuthAttempt("signup", email, false, "Signup failed");
            redirect(`/auth/sign-up?error=${encodeURIComponent("Account creation failed")}`);
        }

        logAuthAttempt("signup", email, true);

        // Revalidate layout to update auth state
        revalidatePath("/", "layout");

        // Redirect to main app
        redirect(REDIRECT_PATHS.DEFAULT_AFTER_LOGIN);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unexpected error";
        logAuthAttempt("signup", email, false, errorMsg);
        redirect(`/auth/sign-up?error=${encodeURIComponent("Account creation failed")}`);
    }
}
