"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { updateUserProfile, upsertUser } from "@/lib/db/users";
import { createClient } from "@/lib/supabase/server";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<
  string,
  { attempts: number; lastAttempt: number }
>();

// Validation schemas
const signInSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  hashedPassword: z.string().optional(), // For client-side hashed passwords
});

const signUpSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email address")
      .min(1, "Email is required"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
    hashedPassword: z.string().optional(), // For client-side hashed passwords
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Rate limiting helper
function checkRateLimit(
  identifier: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now });
    return true;
  }

  // Reset if window has passed
  if (now - record.lastAttempt > windowMs) {
    rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now });
    return true;
  }

  // Check if exceeded
  if (record.attempts >= maxAttempts) {
    return false;
  }

  // Increment attempts
  record.attempts++;
  record.lastAttempt = now;
  return true;
}

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
 * Server action for secure login using Supabase authentication
 * Uses Supabase's built-in password hashing and validation
 */
export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    const supabase = await createClient();

    // Use Supabase's secure signInWithPassword method
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Sync user with database
      await upsertUser(data.user);

      // Revalidate cached data
      revalidatePath("/", "layout");

      // Redirect to main app
      redirect("/calories");
    }

    return { success: false, error: "Login failed" };
  } catch (error) {
    console.error("Server login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
}

/**
 * Server action for secure signup using Supabase authentication
 * Uses Supabase's built-in password hashing and validation
 */
export async function signupAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  // Basic password validation (Supabase will do more comprehensive validation)
  if (password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters long",
    };
  }

  try {
    const supabase = await createClient();

    // Use Supabase's secure signUp method
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/calories`,
      },
    });

    if (error) {
      console.error("Signup error:", error);
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Check if user is immediately confirmed (auto-confirm enabled)
      if (data.session) {
        // User is automatically signed in
        await upsertUser(data.user);
        revalidatePath("/", "layout");
        redirect("/calories");
      } else {
        // Email confirmation required
        redirect("/auth/sign-up-success");
      }
    }

    return { success: false, error: "Signup failed" };
  } catch (error) {
    console.error("Server signup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Signup failed",
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
      error: error instanceof Error ? error.message : "Password reset failed",
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
    redirect("/calories");
  } catch (error) {
    console.error("Server password update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Password update failed",
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
export async function signInAction(formData: FormData) {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    hashedPassword: formData.get("hashedPassword") as string, // Optional client-side hashed password
  };

  // Input validation with Zod
  const validation = signInSchema.safeParse(rawData);
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || "Invalid input";
    logAuthAttempt("signin", rawData.email || "unknown", false, errorMessage);
    redirect(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
  }

  const { email, password, hashedPassword } = validation.data;

  // Rate limiting by email
  if (!checkRateLimit(`signin:${email}`)) {
    logAuthAttempt("signin", email, false, "Rate limit exceeded");
    redirect(
      "/auth/login?error=Too many login attempts. Please try again later.",
    );
  }

  const supabase = await createClient();

  try {
    // Use client-side hashed password if provided, otherwise use plain password
    const authPassword = hashedPassword || password;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: authPassword,
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
      rateLimitStore.delete(`signin:${email}`);

      logAuthAttempt("signin", email, true);

      // Revalidate layout to update auth state
      revalidatePath("/", "layout");

      // Redirect to main app
      redirect("/calories");
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
export async function signUpAction(formData: FormData) {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    hashedPassword: formData.get("hashedPassword") as string, // Optional client-side hashed password
  };

  // Input validation with Zod
  const validation = signUpSchema.safeParse(rawData);
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || "Invalid input";
    logAuthAttempt("signup", rawData.email || "unknown", false, errorMessage);
    redirect(`/auth/sign-up?error=${encodeURIComponent(errorMessage)}`);
  }

  const { email, password, hashedPassword } = validation.data;

  // Rate limiting by email
  if (!checkRateLimit(`signup:${email}`)) {
    logAuthAttempt("signup", email, false, "Rate limit exceeded");
    redirect(
      "/auth/sign-up?error=Too many signup attempts. Please try again later.",
    );
  }

  const supabase = await createClient();

  try {
    // Use client-side hashed password if provided, otherwise use plain password
    const authPassword = hashedPassword || password;

    const { data, error } = await supabase.auth.signUp({
      email,
      password: authPassword,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/calories`,
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
        rateLimitStore.delete(`signup:${email}`);

        logAuthAttempt("signup", email, true);

        revalidatePath("/", "layout");
        redirect("/calories");
      } else {
        // Email confirmation required
        logAuthAttempt("signup", email, true, "Email confirmation required");
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
