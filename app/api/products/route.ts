import { NextResponse, type NextRequest } from "next/server";

import {
  addRateLimitHeaders,
  checkRateLimit,
  rateLimiters,
} from "@/lib/rate-limit";
import {
  getSecurityHeaders,
  RequestSchemas,
  validateContentType,
  validateRequest,
  validateRequestSize,
} from "@/lib/validations/request-validation";

export async function GET(request: NextRequest) {
  // Check rate limit for external API proxy (OpenFoodFacts)
  const rateLimitResult = await checkRateLimit(request, rateLimiters.external);

  if (rateLimitResult.rateLimited) {
    const securityHeaders = getSecurityHeaders();
    addRateLimitHeaders(securityHeaders, rateLimitResult);

    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: securityHeaders,
      },
    );
  }

  // Validate query parameters if searching
  const url = new URL(request.url);
  const barcode = url.searchParams.get("barcode");
  const searchQuery = url.searchParams.get("q");

  if (barcode) {
    const validation = await validateRequest(
      request,
      RequestSchemas.barcodeQuery,
      { source: "query" },
    );

    if (!validation.success) {
      const securityHeaders = getSecurityHeaders();
      return NextResponse.json(
        { error: "Invalid barcode format", details: validation.error },
        { status: 400, headers: securityHeaders },
      );
    }

    // TODO: Implement barcode lookup with cached API
  }

  if (searchQuery) {
    const validation = await validateRequest(
      request,
      RequestSchemas.searchQuery,
      { source: "query" },
    );

    if (!validation.success) {
      const securityHeaders = getSecurityHeaders();
      return NextResponse.json(
        { error: "Invalid search query", details: validation.error },
        { status: 400, headers: securityHeaders },
      );
    }

    // TODO: Implement product search
  }

  const headers = getSecurityHeaders();
  addRateLimitHeaders(headers, rateLimitResult);
  return NextResponse.json({ message: "Products API endpoint" }, { headers });
}

export async function POST(request: NextRequest) {
  // Validate request size and content type
  if (!validateRequestSize(request, 1024 * 10)) {
    // 10KB limit
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

  // Check rate limit for product creation
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
      {
        status: 429,
        headers: securityHeaders,
      },
    );
  }

  // Validate request body with Zod
  const validation = await validateRequest(
    request,
    RequestSchemas.createProduct,
  );

  if (!validation.success) {
    const securityHeaders = getSecurityHeaders();
    addRateLimitHeaders(securityHeaders, rateLimitResult);

    return NextResponse.json(
      { error: "Invalid request data", details: validation.error },
      { status: 400, headers: securityHeaders },
    );
  }

  // TODO: Implement actual product creation logic with validation.data
  const { name, quantity, kcal } = validation.data;

  const headers = getSecurityHeaders();
  addRateLimitHeaders(headers, rateLimitResult);
  return NextResponse.json(
    {
      message: "Product created successfully",
      product: { name, quantity, kcal },
    },
    { headers },
  );
}
