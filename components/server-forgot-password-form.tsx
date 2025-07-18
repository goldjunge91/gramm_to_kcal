import Link from "next/link";
import React from "react";

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
import { resetPasswordAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

interface ServerForgotPasswordFormProps {
  className?: string;
  error?: string;
  success?: string;
}

/**
 * Server-side forgot password form using Supabase server actions
 * Provides secure password reset without client-side exposure
 */
export function ServerForgotPasswordForm({
  className,
  error,
  success,
}: ServerForgotPasswordFormProps) {
  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent a password reset link to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 p-3 border border-green-200">
                <p className="text-sm text-green-600">{success}</p>
              </div>
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm underline underline-offset-4"
                >
                  Back to login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [localError, setLocalError] = React.useState<string | undefined>(
    undefined,
  );
  const [localSuccess, setLocalSuccess] = React.useState<string | undefined>(
    undefined,
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(undefined);
    setLocalSuccess(undefined);
    const formData = new FormData(e.currentTarget);
    const result = await resetPasswordAction(formData);
    if (result.success) {
      setLocalSuccess(result.message || "Check your email for the reset link.");
    } else {
      setLocalError(result.error || "An error occurred.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              {(error || localError) && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200">
                  <p className="text-sm text-red-600">{error || localError}</p>
                </div>
              )}
              {(success || localSuccess) && (
                <div className="rounded-md bg-green-50 p-3 border border-green-200">
                  <p className="text-sm text-green-600">
                    {success || localSuccess}
                  </p>
                </div>
              )}
              <Button type="submit" className="w-full">
                Send reset link
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Remember your password?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
