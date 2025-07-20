"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Social Signup Funktion außerhalb von handleSignUp, damit sie im JSX verwendet werden kann
  const handleSocialSignUp = async (provider: "github" | "google") => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/oauth?next=/calories`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Social Signup Funktion außerhalb von handleSignUp, damit sie im JSX verwendet werden kann

  const getErrorMessage = (error: any): string => {
    if (!error) return "An unexpected error occurred";

    const message = error.message || error.toString();

    // Map common Supabase auth errors to user-friendly messages
    if (message.includes("User already registered")) {
      return "An account with this email already exists. Please sign in instead.";
    }
    if (message.includes("Password should be at least")) {
      return "Password must be at least 6 characters long.";
    }
    if (message.includes("Invalid email")) {
      return "Please enter a valid email address.";
    }
    if (message.includes("Signup is disabled")) {
      return "Account registration is currently disabled. Please contact support.";
    }
    if (message.includes("Too many requests")) {
      return "Too many signup attempts. Please wait a few minutes before trying again.";
    }

    return message;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== repeatPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      toast.error("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      toast.loading("Creating your account...", { id: "signup" });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/calories`,
        },
      });

      if (error) throw error;

      // Check if user is immediately confirmed (auto-confirm enabled)
      if (data.user && data.session) {
        // User is automatically signed in
        toast.success("Account created and signed in successfully!", {
          id: "signup",
          duration: 3000,
        });

        // Clear form
        setEmail("");
        setPassword("");
        setRepeatPassword("");

        // Redirect to protected area
        setTimeout(() => {
          router.push("/calories");
        }, 1000);
      } else {
        // Email confirmation required
        toast.success(
          "Account created successfully! Please check your email to confirm.",
          {
            id: "signup",
            duration: 5000,
          },
        );

        // Clear form
        setEmail("");
        setPassword("");
        setRepeatPassword("");

        // Navigate to success page
        setTimeout(() => {
          router.push("/auth/sign-up-success");
        }, 1000);
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage, { id: "signup" });
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
          <div className="mt-4 flex gap-2 justify-center">
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => handleSocialSignUp("github")}
              disabled={isLoading}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="inline"
              >
                <path d="M10 .3a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-2.2-.2-4.5-1.1-4.5-5A4 4 0 0 1 4.7 7.2c-.1-.3-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.7 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.2.1 2.5a4 4 0 0 1 1.1 2.8c0 3.9-2.3 4.8-4.5 5 .3.3.6.8.6 1.6v2.4c0 .3.2.6.7.5A10 10 0 0 0 10 .3" />
              </svg>
              Github
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => handleSocialSignUp("google")}
              disabled={isLoading}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="inline"
              >
                <path d="M19.6 10.2c0-.7-.1-1.4-.2-2H10v3.8h5.4c-.2 1-.8 1.8-1.6 2.3v1.9h2.6c1.5-1.4 2.2-3.5 2.2-5.9z" />
                <path d="M10 20c2.7 0 5-1 6.6-2.7l-3.2-2.6c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H1.2v2.6A10 10 0 0 0 10 20z" />
                <path d="M4.4 12.3c-.2-.6-.4-1.3-.4-2s.2-1.4.4-2V5.7H1.2A10 10 0 0 0 0 10c0 1.6.4 3.1 1.2 4.3l3.2-2.6z" />
                <path d="M10 4c1.5 0 2.8.5 3.8 1.4l2.8-2.8A10 10 0 0 0 10 0C6.1 0 2.7 2.4 1.2 5.7l3.2 2.6C5.2 5.7 7.4 4 10 4z" />
              </svg>
              Google
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <span className="ml-auto text-xs text-muted-foreground">
                    Min. 6 characters
                  </span>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your password"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Repeat your password"
                />
              </div>
              {error && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
