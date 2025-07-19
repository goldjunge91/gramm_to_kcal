/**
 * Debug endpoint for testing middleware route protection
 * Only available in development environment
 */

import type { NextRequest } from "next/server";

// eslint-disable-next-line no-duplicate-imports
import { NextResponse } from "next/server";

import { debugRouteMatching } from "@/lib/middleware/route-matcher";

export function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Debug endpoint only available in development" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get("path") || "/";

  // Debug the route matching for the given path
  const debugInfo = debugRouteMatching(pathname);

  // Test all route types
  const testRoutes = [
    "/",
    "/calories",
    "/recipe",
    "/auth/login",
    "/auth/sign-up",
    "/account",
    "/dashboard",
    "/api/health",
    "/api/test-env",
    "/api/products",
    "/api/user/profile",
    "/_next/static/test.js",
    "/favicon.ico",
    "/image.png",
    "/unknown-route",
  ];

  const testResults = testRoutes.map((path) => ({
    path,
    ...debugRouteMatching(path),
  }));

  return NextResponse.json({
    requestedPath: pathname,
    debugInfo,
    testResults,
    middleware: {
      version: "2.0.0",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Debug endpoint only available in development" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { paths = [] } = body;

    if (!Array.isArray(paths)) {
      return NextResponse.json(
        { error: "paths must be an array" },
        { status: 400 },
      );
    }

    const results = paths.map((path) => ({
      path,
      ...debugRouteMatching(path),
    }));

    return NextResponse.json({
      testResults: results,
      middleware: {
        version: "2.0.0",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
