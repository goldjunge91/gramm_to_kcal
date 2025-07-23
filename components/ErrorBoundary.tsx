"use client";

import type { ErrorInfo, ReactNode } from "react";

import { Component } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Error boundary component to catch and display React errors gracefully
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[400px] w-full items-center justify-center p-6">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="text-2xl text-destructive">
                                Something went wrong
                            </CardTitle>
                            <CardDescription>
                                An unexpected error occurred. Please try again.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {this.state.error && (
                                <div className="rounded-md bg-muted p-3">
                                    <p className="text-sm font-mono text-muted-foreground">
                                        {this.state.error.message}
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    onClick={this.handleReset}
                                    variant="outline"
                                >
                                    Try Again
                                </Button>
                                <Button onClick={this.handleReload}>
                                    Reload Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
