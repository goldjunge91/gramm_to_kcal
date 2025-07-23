"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";

/**
 * Server action to sign out user
 */
export async function signOutUser() {
    try {
        await auth.api.signOut({
            headers: new Headers(),
        });

        revalidatePath("/", "layout");
        redirect("/");
    }
    catch (error) {
        console.error("Sign out error:", error);
        redirect("/auth/login?error=Sign out failed");
    }
}
