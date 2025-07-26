"use client";

import Link from "next/link";
import { useState } from "react";

import { resetPasswordAction } from "@/actions/password";
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
import { formatErrorForUser, toAppError } from "@/lib/utils/error-utils";
import { createLogger } from "@/lib/utils/logger";

export function ForgotPasswordForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const logger = createLogger();
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const getErrorMessage = (error: unknown): string => {
        const appError = toAppError(error, "forgot-password");

        // Auth-specific error handling
        if (appError.type === "auth") {
            const message = appError.message || appError.error_description || "";

            if (message.includes("Invalid email")) {
                return "Please enter a valid email address.";
            }
            if (message.includes("User not found")) {
                return "No account found with this email address.";
            }
            if (message.includes("Too many requests")) {
                return "Too many password reset attempts. Please wait a few minutes before trying again.";
            }
        }

        // Use the formatted error message with fallback
        const formattedMessage = formatErrorForUser(appError);
        return formattedMessage || "Failed to send password reset email. Please try again.";
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("email", email);

            const result = await resetPasswordAction(formData);

            if (result.success) {
                setSuccess(true);
            }
            else {
                setError(result.error || "Password reset failed");
            }
        }
        catch (error: unknown) {
            const errorMessage = getErrorMessage(error);
            setError(errorMessage);
            logger.error("Password reset error", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                email: `${email.substring(0, 3)}***`, // Partially mask email for privacy
                userAgent: navigator.userAgent,
                context: "password_reset",
            });
        }
        finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            {success ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            Check Your Email
                        </CardTitle>
                        <CardDescription>
                            Password reset instructions sent
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            If you registered using your email and password, you
                            will receive a password reset email.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            Reset Your Password
                        </CardTitle>
                        <CardDescription>
                            Type in your email and we&apos;ll send you a link to
                            reset your password
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleForgotPassword}>
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        required
                                        value={email}
                                        onChange={e =>
                                            setEmail(e.target.value)}
                                    />
                                </div>
                                {error && (
                                    <p className="text-sm text-red-500">
                                        {error}
                                    </p>
                                )}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading
                                        ? "Sending..."
                                        : "Send reset email"}
                                </Button>
                            </div>
                            <div className="mt-4 text-center text-sm">
                                Already have an account?
                                {" "}
                                <Link
                                    href="/auth/login"
                                    className="underline underline-offset-4"
                                >
                                    Login
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
