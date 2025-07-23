"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/lib/auth/auth-client";

export default function Page() {
    const { isPending } = useSession();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        // Check if user is already signed in
        if (!isPending) {
            setIsCheckingAuth(false);
        }
    }, [isPending]);

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">
                                Thank you for signing up!
                            </CardTitle>
                            <CardDescription>
                                Check your email to confirm
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isCheckingAuth ? (
                                <div className="flex items-center justify-center py-4">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        Checking authentication status...
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        You&apos;ve successfully signed up.
                                        Please check your email to confirm your
                                        account. Once confirmed, you&apos;ll be
                                        automatically signed in.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">
                                            Didn&apos;t receive an email? Check
                                            your spam folder or try signing up
                                            again.
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Link href="/auth/login">
                                                    Back to Login
                                                </Link>
                                            </Button>
                                            <Button asChild size="sm">
                                                <Link href="/">Go to Home</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
