/**
 * Route matching utilities for middleware
 * Provides utilities for pattern matching and route validation
 */

import { getRouteGroup, ROUTE_CONFIGS, type RouteGroup } from "./routes";

export interface MatchResult {
  matches: boolean;
  group: RouteGroup | null;
  pattern?: string;
  description?: string;
}

/**
 * Create a route matcher function for specific patterns
 */
export function createRouteMatcher(
  patterns: string[] | string,
): (pathname: string) => boolean {
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];

  return (pathname: string): boolean => {
    return patternArray.some((pattern) => {
      // Handle exact matches
      if (pattern === pathname) return true;

      // Handle wildcard patterns (ending with /*)
      if (pattern.endsWith("/*")) {
        const basePattern = pattern.slice(0, -2);
        return (
          pathname === basePattern || pathname.startsWith(`${basePattern}/`)
        );
      }

      // Handle regex patterns (containing special regex characters)
      if (pattern.includes(".*") || pattern.includes("\\")) {
        try {
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(pathname);
        } catch {
          return false;
        }
      }

      // Handle prefix matches (for paths like /api)
      if (pathname.startsWith(pattern)) {
        return true;
      }

      return false;
    });
  };
}

/**
 * Match a pathname against all configured routes and return detailed result
 */
export function matchRoute(pathname: string): MatchResult {
  // First check against configured patterns
  for (const config of ROUTE_CONFIGS) {
    const matcher = createRouteMatcher(config.pattern);
    if (matcher(pathname)) {
      return {
        matches: true,
        group: config.group,
        pattern: config.pattern,
        description: config.description,
      };
    }
  }

  // Fallback to group-based matching
  const group = getRouteGroup(pathname);
  return {
    matches: group !== null,
    group,
  };
}

/**
 * Check if pathname matches any of the given patterns
 */
export function matchesAnyPattern(
  pathname: string,
  patterns: string[],
): boolean {
  const matcher = createRouteMatcher(patterns);
  return matcher(pathname);
}

/**
 * Validate if a route configuration is valid
 */
export function validateRouteConfig(pattern: string): boolean {
  try {
    // Test if pattern is a valid regex
    if (pattern.includes(".*") || pattern.includes("\\")) {
      new RegExp(`^${pattern}$`);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all routes that match a specific group
 */
export function getRoutesForGroup(group: RouteGroup): string[] {
  return ROUTE_CONFIGS.filter((config) => config.group === group).map(
    (config) => config.pattern,
  );
}

/**
 * Debug function to test route matching
 */
export function debugRouteMatching(pathname: string): {
  pathname: string;
  result: MatchResult;
  allMatches: Array<{ pattern: string; group: RouteGroup; matches: boolean }>;
} {
  const result = matchRoute(pathname);

  const allMatches = ROUTE_CONFIGS.map((config) => ({
    pattern: config.pattern,
    group: config.group,
    matches: createRouteMatcher(config.pattern)(pathname),
  }));

  return {
    pathname,
    result,
    allMatches,
  };
}

/**
 * Pre-compiled matchers for performance
 */
export const ROUTE_MATCHERS = {
  public: createRouteMatcher([
    "/",
    "/calories",
    "/calories/*",
    "/recipe",
    "/recipe/*",
    "/health",
    "/error",
    "/dev-scanner",
    "/unit-converter",
    "/anleitungsgenerator",
    "/debug",
    "/debug/*",
    "/_next/static/*",
    "/_next/image/*",
    "/favicon.ico",
    String.raw`/.*\.(svg|png|jpg|jpeg|gif|webp)$`,
  ]),

  auth: createRouteMatcher(["/auth/*"]),

  protected: createRouteMatcher([
    "/account",
    "/account/*",
    "/dashboard",
    "/dashboard/*",
  ]),

  apiPublic: createRouteMatcher([
    "/api/health",
    "/api/test-env",
    "/api/debug",
    "/api/debug/*",
  ]),

  apiProtected: createRouteMatcher([
    "/api/products",
    "/api/products/*",
    "/api/user",
    "/api/user/*",
    "/api/recipes",
    "/api/recipes/*",
    "/api/ingredients",
    "/api/ingredients/*",
  ]),

  api: createRouteMatcher(["/api/*"]),

  staticFiles: createRouteMatcher([
    "/_next/static/*",
    "/_next/image/*",
    "/favicon.ico",
    String.raw`/.*\.(svg|png|jpg|jpeg|gif|webp)$`,
  ]),
} as const;

/**
 * Fast route checking using pre-compiled matchers
 */
export const isPublicRoute = (pathname: string): boolean =>
  ROUTE_MATCHERS.public(pathname);

export const isAuthRoute = (pathname: string): boolean =>
  ROUTE_MATCHERS.auth(pathname);

export const isProtectedRoute = (pathname: string): boolean =>
  ROUTE_MATCHERS.protected(pathname);

export const isApiRoute = (pathname: string): boolean =>
  ROUTE_MATCHERS.api(pathname);

export const isApiPublicRoute = (pathname: string): boolean =>
  ROUTE_MATCHERS.apiPublic(pathname);

export const isApiProtectedRoute = (pathname: string): boolean =>
  ROUTE_MATCHERS.apiProtected(pathname);

export const isStaticFile = (pathname: string): boolean =>
  ROUTE_MATCHERS.staticFiles(pathname);
