/**
 * Enhanced authentication middleware logic
 * Handles authentication, authorization, and route protection
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

import {
  isApiProtectedRoute,
  isApiPublicRoute,
  isApiRoute,
  isAuthRoute,
  isProtectedRoute,
  isPublicRoute,
  isStaticFile,
  matchRoute,
} from "./route-matcher";
import { REDIRECT_PATHS, type RouteGroup } from "./routes";

export interface AuthMiddlewareOptions {
  debug?: boolean;
  apiKeyHeader?: string;
  allowedApiKeys?: string[];
}

export interface AuthContext {
  isAuthenticated: boolean;
  user: any;
  routeGroup: RouteGroup | null;
  pathname: string;
  isApi: boolean;
}

/**
 * Main authentication middleware function
 */
export async function authMiddleware(
  request: NextRequest,
  options: AuthMiddlewareOptions = {},
): Promise<NextResponse> {
  const { debug = false } = options;
  const pathname = request.nextUrl.pathname;

  // Skip processing for static files
  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }

  if (debug) {
    console.log(`[Auth Middleware] Processing: ${pathname}`);
  }

  // Determine route characteristics
  const matchResult = matchRoute(pathname);
  const isApi = isApiRoute(pathname);

  if (debug) {
    console.log(`[Auth Middleware] Route match:`, matchResult);
  }

  // Handle API routes
  if (isApi) {
    return await handleApiRoute(request, options);
  }

  // Handle page routes
  return await handlePageRoute(request, options);
}

/**
 * Handle API route authentication
 */
async function handleApiRoute(
  request: NextRequest,
  options: AuthMiddlewareOptions,
): Promise<NextResponse> {
  const {
    debug = false,
    apiKeyHeader = "x-api-key",
    allowedApiKeys = [],
  } = options;
  const pathname = request.nextUrl.pathname;

  // Allow public API routes
  if (isApiPublicRoute(pathname)) {
    if (debug) {
      console.log(`[Auth Middleware] Public API route allowed: ${pathname}`);
    }
    return await updateSession(request);
  }

  // Check for API key authentication for protected APIs
  if (allowedApiKeys.length > 0) {
    const apiKey = request.headers.get(apiKeyHeader);
    if (apiKey && allowedApiKeys.includes(apiKey)) {
      if (debug) {
        console.log(`[Auth Middleware] API key authenticated: ${pathname}`);
      }
      return await updateSession(request);
    }
  }

  // For protected API routes, check user authentication
  if (isApiProtectedRoute(pathname)) {
    const authContext = await getAuthContext(request);

    if (!authContext.isAuthenticated) {
      if (debug) {
        console.log(`[Auth Middleware] API route unauthorized: ${pathname}`);
      }
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }

    if (debug) {
      console.log(`[Auth Middleware] API route authorized: ${pathname}`);
    }
    return await updateSession(request);
  }

  // Default: allow with session update
  return await updateSession(request);
}

/**
 * Handle page route authentication
 */
async function handlePageRoute(
  request: NextRequest,
  options: AuthMiddlewareOptions,
): Promise<NextResponse> {
  const { debug = false } = options;
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    if (debug) {
      console.log(`[Auth Middleware] Public route allowed: ${pathname}`);
    }
    return await updateSession(request);
  }

  // Get authentication context
  const authContext = await getAuthContext(request);

  // Handle auth routes (login, signup, etc.)
  if (isAuthRoute(pathname)) {
    if (authContext.isAuthenticated) {
      // Redirect authenticated users away from auth pages
      if (debug) {
        console.log(
          `[Auth Middleware] Redirecting authenticated user from auth route: ${pathname}`,
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = REDIRECT_PATHS.DEFAULT_AFTER_LOGIN;
      return NextResponse.redirect(url);
    }

    if (debug) {
      console.log(
        `[Auth Middleware] Auth route allowed for unauthenticated user: ${pathname}`,
      );
    }
    return await updateSession(request);
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!authContext.isAuthenticated) {
      if (debug) {
        console.log(
          `[Auth Middleware] Redirecting unauthenticated user to login: ${pathname}`,
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = REDIRECT_PATHS.LOGIN;
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    if (debug) {
      console.log(`[Auth Middleware] Protected route authorized: ${pathname}`);
    }
    return await updateSession(request);
  }

  // For unknown routes, default to protection
  if (!authContext.isAuthenticated) {
    if (debug) {
      console.log(
        `[Auth Middleware] Unknown route, redirecting to login: ${pathname}`,
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = REDIRECT_PATHS.LOGIN;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (debug) {
    console.log(
      `[Auth Middleware] Unknown route allowed for authenticated user: ${pathname}`,
    );
  }
  return await updateSession(request);
}

/**
 * Get authentication context from the request
 */
async function getAuthContext(request: NextRequest): Promise<AuthContext> {
  const pathname = request.nextUrl.pathname;
  const matchResult = matchRoute(pathname);

  try {
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op for read-only context
          },
        },
      },
    );

    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;

    return {
      isAuthenticated: !!user,
      user,
      routeGroup: matchResult.group,
      pathname,
      isApi: isApiRoute(pathname),
    };
  } catch (error) {
    console.error("[Auth Middleware] Error getting auth context:", error);
    return {
      isAuthenticated: false,
      user: null,
      routeGroup: matchResult.group,
      pathname,
      isApi: isApiRoute(pathname),
    };
  }
}

/**
 * Update session cookies (from original middleware)
 */
async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: DO NOT REMOVE auth.getClaims()
  await supabase.auth.getClaims();

  return supabaseResponse;
}

/**
 * Create a middleware with specific options
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  return (request: NextRequest) => authMiddleware(request, options);
}

/**
 * Development helper to debug authentication
 */
export async function debugAuth(request: NextRequest): Promise<{
  pathname: string;
  authContext: AuthContext;
  matchResult: ReturnType<typeof matchRoute>;
  routeChecks: {
    isPublic: boolean;
    isAuth: boolean;
    isProtected: boolean;
    isApi: boolean;
    isApiPublic: boolean;
    isApiProtected: boolean;
    isStatic: boolean;
  };
}> {
  const pathname = request.nextUrl.pathname;
  const authContext = await getAuthContext(request);
  const matchResult = matchRoute(pathname);

  return {
    pathname,
    authContext,
    matchResult,
    routeChecks: {
      isPublic: isPublicRoute(pathname),
      isAuth: isAuthRoute(pathname),
      isProtected: isProtectedRoute(pathname),
      isApi: isApiRoute(pathname),
      isApiPublic: isApiPublicRoute(pathname),
      isApiProtected: isApiProtectedRoute(pathname),
      isStatic: isStaticFile(pathname),
    },
  };
}
