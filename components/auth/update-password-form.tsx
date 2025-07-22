"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updatePasswordAction } from "@/actions/password";
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

export function UpdatePasswordForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const getErrorMessage = (error: any): string => {
        if (!error)
            return "An unexpected error occurred";

        const message = error.message || error.toString();

        if (message.includes("Password should be at least")) {
            return "Password must be at least 6 characters long.";
        }
        if (message.includes("New password should be different")) {
            return "Your new password must be different from your current password.";
        }
        if (message.includes("Invalid password")) {
            return "Please enter a valid password.";
        }

        return message;
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Validate password strength
        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            setIsLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("password", password);

            const result = await updatePasswordAction(formData);

            if (result.success) {
                // Redirect to calories page
                router.push("/calories");
            }
            else {
                setError(result.error || "Password update failed");
            }
        }
        catch (error: unknown) {
            const errorMessage = getErrorMessage(error);
            setError(errorMessage);
            console.error("Password update error:", error);
        }
        finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Reset Your Password</CardTitle>
                    <CardDescription>
                        Please enter your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="password">New password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="New password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save new password"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
