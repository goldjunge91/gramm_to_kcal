import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { circuitBreakerManager } from "@/lib/circuit-breaker";
import {
  addRateLimitHeaders,
  checkRateLimit,
  rateLimiters,
} from "@/lib/rate-limit";
import {
  getSecurityHeaders,
  validateContentType,
  validateRequest,
  validateRequestSize,
} from "@/lib/validations/request-validation";

// Admin action schema
const AdminActionSchema = z.object({
  action: z.enum(["reset", "open", "close"]),
  service: z.string().optional(), // If not provided, applies to all services
});

export async function GET(request: NextRequest) {
  // Apply rate limiting for admin endpoints
  const rateLimitResult = await checkRateLimit(request, rateLimiters.api);

  if (rateLimitResult.rateLimited) {
    const securityHeaders = getSecurityHeaders();
    addRateLimitHeaders(securityHeaders, rateLimitResult);

    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      { status: 429, headers: securityHeaders },
    );
  }

  try {
    // Get all circuit breaker statuses
    const allStatus = await circuitBreakerManager.getAllStatus();
    const healthSummary = await circuitBreakerManager.getHealthSummary();

    const headers = getSecurityHeaders();
    addRateLimitHeaders(headers, rateLimitResult);

    return NextResponse.json(
      {
        summary: healthSummary,
        services: allStatus,
        timestamp: new Date().toISOString(),
      },
      { headers },
    );
  } catch (error) {
    const headers = getSecurityHeaders();
    addRateLimitHeaders(headers, rateLimitResult);

    return NextResponse.json(
      {
        error: "Failed to get circuit breaker status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers },
    );
  }
}

export async function POST(request: NextRequest) {
  // Validate request size and content type
  if (!validateRequestSize(request, 1024)) {
    // 1KB limit
    const securityHeaders = getSecurityHeaders();
    return NextResponse.json(
      { error: "Request too large" },
      { status: 413, headers: securityHeaders },
    );
  }

  if (!validateContentType(request, ["application/json"])) {
    const securityHeaders = getSecurityHeaders();
    return NextResponse.json(
      { error: "Invalid content type" },
      { status: 415, headers: securityHeaders },
    );
  }

  // Apply stricter rate limiting for admin actions
  const rateLimitResult = await checkRateLimit(request, rateLimiters.auth);

  if (rateLimitResult.rateLimited) {
    const securityHeaders = getSecurityHeaders();
    addRateLimitHeaders(securityHeaders, rateLimitResult);

    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Too many admin requests. Please try again later.",
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      { status: 429, headers: securityHeaders },
    );
  }

  // Validate request body
  const validation = await validateRequest(request, AdminActionSchema);

  if (!validation.success) {
    const securityHeaders = getSecurityHeaders();
    addRateLimitHeaders(securityHeaders, rateLimitResult);

    return NextResponse.json(
      { error: "Invalid request data", details: validation.error },
      { status: 400, headers: securityHeaders },
    );
  }

  const { action, service } = validation.data;

  try {
    let result: any = {};

    switch (action) {
      case "reset":
        if (service) {
          const breaker = circuitBreakerManager.get(service);
          if (!breaker) {
            throw new Error(`Service '${service}' not found`);
          }
          await breaker.reset();
          result = {
            message: `Circuit breaker reset for service: ${service}`,
          };
        } else {
          await circuitBreakerManager.emergencyResetAll();
          result = { message: "All circuit breakers reset" };
        }
        break;

      case "open":
        if (service) {
          const breaker = circuitBreakerManager.get(service);
          if (!breaker) {
            throw new Error(`Service '${service}' not found`);
          }
          await breaker.forceOpen();
          result = {
            message: `Circuit breaker opened for service: ${service}`,
          };
        } else {
          await circuitBreakerManager.emergencyOpenAll();
          result = { message: "All circuit breakers opened" };
        }
        break;

      case "close":
        if (service) {
          const breaker = circuitBreakerManager.get(service);
          if (!breaker) {
            throw new Error(`Service '${service}' not found`);
          }
          await breaker.forceClose();
          result = {
            message: `Circuit breaker closed for service: ${service}`,
          };
        } else {
          // Close all is not implemented for safety - must be done individually
          throw new Error(
            "Closing all circuit breakers at once is not allowed. Please specify a service.",
          );
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Get updated status
    const updatedStatus = await circuitBreakerManager.getHealthSummary();

    const headers = getSecurityHeaders();
    addRateLimitHeaders(headers, rateLimitResult);

    return NextResponse.json(
      {
        ...result,
        action,
        service,
        updatedStatus,
        timestamp: new Date().toISOString(),
      },
      { headers },
    );
  } catch (error) {
    const headers = getSecurityHeaders();
    addRateLimitHeaders(headers, rateLimitResult);

    return NextResponse.json(
      {
        error: "Circuit breaker operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers },
    );
  }
}

// Health check endpoint specifically for circuit breakers
export async function HEAD(request: NextRequest) {
  try {
    // Logging für Monitoring
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    console.info(`[CB-Health] HEAD request from IP: ${ip}, UA: ${userAgent}`);

    const healthSummary = await circuitBreakerManager.getHealthSummary();
    const allHealthy = healthSummary.healthy === healthSummary.total;

    const headers = getSecurityHeaders();
    headers.set(
      "X-Circuit-Breaker-Health",
      allHealthy ? "healthy" : "degraded",
    );
    headers.set("X-Circuit-Breaker-Total", healthSummary.total.toString());
    headers.set("X-Circuit-Breaker-Healthy", healthSummary.healthy.toString());
    headers.set("X-Circuit-Breaker-Open", healthSummary.open.toString());

    return new NextResponse(null, {
      status: allHealthy ? 200 : 503,
      headers,
    });
  } catch {
    const headers = getSecurityHeaders();
    return new NextResponse(null, {
      status: 500,
      headers,
    });
  }
}
