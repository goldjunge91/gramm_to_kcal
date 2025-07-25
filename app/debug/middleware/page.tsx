"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/utils/logger";

interface RouteDebugInfo {
    pathname: string;
    result: {
        matches: boolean;
        group: string | null;
        pattern?: string;
        description?: string;
    };
    allMatches: Array<{
        pattern: string;
        group: string;
        matches: boolean;
    }>;
}

interface TestResult {
    path: string;
    pathname: string;
    result: {
        matches: boolean;
        group: string | null;
        pattern?: string;
        description?: string;
    };
    allMatches: Array<{
        pattern: string;
        group: string;
        matches: boolean;
    }>;
}

export default function MiddlewareDebugPage() {
    const logger = createLogger();
    const isDev = env.NEXT_PUBLIC_NODE_ENV === "development";
    if (!isDev) {
        return (
            <div className="container mx-auto p-4">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-center text-muted-foreground">
                            Diese Debug-Seite ist nur im Entwicklungsmodus
                            verfügbar.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const [debugInfo, setDebugInfo] = useState<RouteDebugInfo | null>(null);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [testPath, setTestPath] = useState("/");
    const [loading, setLoading] = useState(false);
    const fetchDebugInfo = async (path: string = "/") => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/debug/middleware?path=${encodeURIComponent(path)}`,
            );
            const data = await response.json();
            setDebugInfo(data.debugInfo);
            setTestResults(data.testResults);
        }
        catch (error) {
            logger.error("Failed to fetch middleware debug info", {
                error: error instanceof Error ? error.message : String(error),
                path,
                operation: "fetchDebugInfo",
            });
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDebugInfo();
    }, []);

    const getGroupColor = (group: string | null) => {
        switch (group) {
            case "PUBLIC":
                return "bg-green-100 text-green-800";
            case "AUTH":
                return "bg-blue-100 text-blue-800";
            case "PROTECTED":
                return "bg-red-100 text-red-800";
            case "API_PUBLIC":
                return "bg-emerald-100 text-emerald-800";
            case "API_PROTECTED":
                return "bg-orange-100 text-orange-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Middleware Route Protection Debug</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={testPath}
                            onChange={e => setTestPath(e.target.value)}
                            placeholder="Enter path to test (e.g., /account, /api/products)"
                            className="flex-1"
                        />
                        <Button
                            onClick={() => fetchDebugInfo(testPath)}
                            disabled={loading}
                        >
                            {loading ? "Testing..." : "Test Path"}
                        </Button>
                    </div>

                    {debugInfo && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Path:
                                    {" "}
                                    {debugInfo.pathname}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            Route Group:
                                        </span>
                                        <Badge
                                            className={getGroupColor(
                                                debugInfo.result.group,
                                            )}
                                        >
                                            {debugInfo.result.group
                                                || "UNKNOWN"}
                                        </Badge>
                                    </div>
                                    {debugInfo.result.pattern && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                Matched Pattern:
                                            </span>
                                            <code className="bg-muted px-2 py-1 rounded text-sm">
                                                {debugInfo.result.pattern}
                                            </code>
                                        </div>
                                    )}
                                    {debugInfo.result.description && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                Description:
                                            </span>
                                            <span className="text-muted-foreground">
                                                {debugInfo.result.description}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All Route Tests</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3">
                        {testResults.map((result, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                        {result.path}
                                    </code>
                                    <Badge
                                        className={getGroupColor(
                                            result.result.group,
                                        )}
                                    >
                                        {result.result.group || "UNKNOWN"}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {result.result.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Route Group Legend</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                                PUBLIC
                            </Badge>
                            <span className="text-sm">No auth required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800">
                                AUTH
                            </Badge>
                            <span className="text-sm">Login/signup pages</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-red-100 text-red-800">
                                PROTECTED
                            </Badge>
                            <span className="text-sm">Auth required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-800">
                                API_PUBLIC
                            </Badge>
                            <span className="text-sm">Public API</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-orange-100 text-orange-800">
                                API_PROTECTED
                            </Badge>
                            <span className="text-sm">Protected API</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
