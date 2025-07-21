import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Alle Mock-Variablen müssen ganz oben stehen!
const mockGetAllStatus = vi.fn();
const mockGetHealthSummary = vi.fn();
const mockEmergencyResetAll = vi.fn();
const mockEmergencyOpenAll = vi.fn();
const mockBreaker = {
  reset: vi.fn(),
  forceOpen: vi.fn(),
  forceClose: vi.fn(),
};
const mockGet = vi.fn();
const mockAddRateLimitHeaders = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockRateLimiters = { api: "api", auth: "auth" };
const mockGetSecurityHeaders = vi.fn(() => new Headers());
const mockValidateContentType = vi.fn();
const mockValidateRequest = vi.fn();
const mockValidateRequestSize = vi.fn();

function createRequest({
  method = "GET",
  headers = {},
  body = null,
}: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}) {
  return {
    method,
    headers: {
      get: (key: string) => headers[key] ?? null,
    },
    json: () => body,
    text: () => JSON.stringify(body),
  } as any;
}

vi.mock("@/lib/circuit-breaker", () => ({
  circuitBreakerManager: {
    getAllStatus: mockGetAllStatus,
    getHealthSummary: mockGetHealthSummary,
    emergencyResetAll: mockEmergencyResetAll,
    emergencyOpenAll: mockEmergencyOpenAll,
    get: mockGet,
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  addRateLimitHeaders: mockAddRateLimitHeaders,
  checkRateLimit: mockCheckRateLimit,
  rateLimiters: mockRateLimiters,
}));

vi.mock("@/lib/validations/request-validation", () => ({
  getSecurityHeaders: mockGetSecurityHeaders,
  validateContentType: mockValidateContentType,
  validateRequest: mockValidateRequest,
  validateRequestSize: mockValidateRequestSize,
}));

let GET: any, HEAD: any, POST: any;

beforeAll(async () => {
  const mod = await import("../app/api/admin/circuit-breakers/route");
  GET = mod.GET;
  HEAD = mod.HEAD;
  POST = mod.POST;
});

describe("GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      rateLimited: false,
      resetTime: Date.now() + 1000,
    });
    mockGetAllStatus.mockResolvedValue({ serviceA: "closed" });
    mockGetHealthSummary.mockResolvedValue({
      healthy: 1,
      total: 1,
      open: 0,
    });
  });

  it("returns 429 if rate limited", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      rateLimited: true,
      resetTime: Date.now() + 1000,
    });
    const res = await GET(createRequest());
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe("Rate limit exceeded");
  });

  it("returns circuit breaker status", async () => {
    const res = await GET(createRequest());
    expect(res.status).toBe(200); // 200 ist Next.js-Default
    const json = await res.json();
    expect(json.summary).toEqual({ healthy: 1, total: 1, open: 0 });
    expect(json.services).toEqual({ serviceA: "closed" });
    expect(json.timestamp).toBeDefined();
  });

  it("returns 500 on error", async () => {
    mockGetAllStatus.mockRejectedValueOnce(new Error("fail"));
    const res = await GET(createRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to get circuit breaker status");
    expect(json.details).toBe("fail");
  });
});

describe("POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateRequestSize.mockReturnValue(true);
    mockValidateContentType.mockReturnValue(true);
    mockCheckRateLimit.mockResolvedValue({
      rateLimited: false,
      resetTime: Date.now() + 1000,
    });
    mockValidateRequest.mockResolvedValue({
      success: true,
      data: { action: "reset" },
    });
    mockGetHealthSummary.mockResolvedValue({
      healthy: 1,
      total: 1,
      open: 0,
    });
    mockEmergencyResetAll.mockResolvedValue(undefined);
    mockEmergencyOpenAll.mockResolvedValue(undefined);
    mockGet.mockReturnValue(mockBreaker);
    mockBreaker.reset.mockResolvedValue(undefined);
    mockBreaker.forceOpen.mockResolvedValue(undefined);
    mockBreaker.forceClose.mockResolvedValue(undefined);
  });

  it("returns 413 if request too large", async () => {
    mockValidateRequestSize.mockReturnValueOnce(false);
    const res = await POST(createRequest({ method: "POST" }));
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error).toBe("Request too large");
  });

  it("returns 415 if invalid content type", async () => {
    mockValidateContentType.mockReturnValueOnce(false);
    const res = await POST(createRequest({ method: "POST" }));
    expect(res.status).toBe(415);
    const json = await res.json();
    expect(json.error).toBe("Invalid content type");
  });

  it("returns 429 if rate limited", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      rateLimited: true,
      resetTime: Date.now() + 1000,
    });
    const res = await POST(createRequest({ method: "POST" }));
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe("Rate limit exceeded");
  });

  it("returns 400 if request validation fails", async () => {
    mockValidateRequest.mockResolvedValueOnce({
      success: false,
      error: "bad data",
    });
    const res = await POST(createRequest({ method: "POST" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid request data");
    expect(json.details).toBe("bad data");
  });

  it("resets all circuit breakers", async () => {
    mockValidateRequest.mockResolvedValueOnce({
      success: true,
      data: { action: "reset" },
    });
    const res = await POST(
      createRequest({ method: "POST", body: { action: "reset" } }),
    );
    const json = await res.json();
    expect(json.message).toBe("All circuit breakers reset");
    expect(json.action).toBe("reset");
    expect(json.updatedStatus).toEqual({ healthy: 1, total: 1, open: 0 });
  });

  it("resets specific circuit breaker", async () => {
    mockValidateRequest.mockResolvedValueOnce({
      success: true,
      data: { action: "reset", service: "svc" },
    });
    mockGet.mockReturnValueOnce(mockBreaker);
    const res = await POST(
      createRequest({
        method: "POST",
        body: { action: "reset", service: "svc" },
      }),
    );
    const json = await res.json();
    expect(json.message).toBe("Circuit breaker reset for service: svc");
    expect(json.action).toBe("reset");
    expect(json.service).toBe("svc");
  });

  it("returns 500 if service not found", async () => {
    mockValidateRequest.mockResolvedValueOnce({
      success: true,
      data: { action: "reset", service: "svc" },
    });
    mockGet.mockReturnValueOnce(undefined);
    const res = await POST(
      createRequest({
        method: "POST",
        body: { action: "reset", service: "svc" },
      }),
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Circuit breaker operation failed");
    expect(json.details).toMatch(/not found/);
  });

  it("opens all circuit breakers", async () => {
    mockValidateRequest.mockResolvedValueOnce({
      success: true,
      data: { action: "open" },
    });
    const res = await POST(
      createRequest({ method: "POST", body: { action: "open" } }),
    );
    const json = await res.json();
    expect(json.message).toBe("All circuit breakers opened");
    expect(json.action).toBe("open");
  });

  it("opens specific circuit breaker", async () => {
    mockValidateRequest.mockResolvedValueOnce({
      success: true,
      data: { action: "open", service: "svc" },
    });
    mockGet.mockReturnValueOnce(mockBreaker);
    const res = await POST(
      createRequest({
        method: "POST",
        body: { action: "open", service: "svc" },
      }),
    );
    const json = await res.json();
    expect(json.message).toBe("Circuit breaker opened for service: svc");
    expect(json.action).toBe("open");
    expect(json.service).toBe("svc");
  });

  it("closes specific circuit breaker", async () => {
    mockValidateRequest.mockResolvedValueOnce({
      success: true,
      data: { action: "close", service: "svc" },
    });
    mockGet.mockReturnValueOnce(mockBreaker);
    const res = await POST(
      createRequest({
        method: "POST",
        body: { action: "close", service: "svc" },
      }),
    );
    const json = await res.json();
    expect(json.message).toBe("Circuit breaker closed for service: svc");
    expect(json.action).toBe("close");
    expect(json.service).toBe("svc");
  });

  it("returns 500 if trying to close all circuit breakers", async () => {
    mockValidateRequest.mockResolvedValueOnce({
      success: true,
      data: { action: "close" },
    });
    const res = await POST(
      createRequest({ method: "POST", body: { action: "close" } }),
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.details).toMatch(/not allowed/);
  });

  it("returns 500 on unknown action", async () => {
    mockValidateRequest.mockResolvedValueOnce({
      success: true,
      data: { action: "unknown" },
    });
    const res = await POST(
      createRequest({ method: "POST", body: { action: "unknown" } }),
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.details).toMatch(/Unknown action/);
  });
});

describe("HEAD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetHealthSummary.mockResolvedValue({
      healthy: 1,
      total: 1,
      open: 0,
    });
  });

  it("returns 200 if all healthy", async () => {
    const req = createRequest({
      method: "HEAD",
      headers: {
        "x-forwarded-for": "1.2.3.4",
        "user-agent": "test-agent",
      },
    });
    const res = await HEAD(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Circuit-Breaker-Health")).toBe("healthy");
    expect(res.headers.get("X-Circuit-Breaker-Total")).toBe("1");
    expect(res.headers.get("X-Circuit-Breaker-Healthy")).toBe("1");
    expect(res.headers.get("X-Circuit-Breaker-Open")).toBe("0");
  });

  it("returns 503 if not all healthy", async () => {
    mockGetHealthSummary.mockResolvedValueOnce({
      healthy: 0,
      total: 1,
      open: 1,
    });
    const req = createRequest({ method: "HEAD", headers: {} });
    const res = await HEAD(req);
    expect(res.status).toBe(503);
    expect(res.headers.get("X-Circuit-Breaker-Health")).toBe("degraded");
  });

  it("returns 500 on error", async () => {
    mockGetHealthSummary.mockRejectedValueOnce(new Error("fail"));
    const req = createRequest({ method: "HEAD", headers: {} });
    const res = await HEAD(req);
    expect(res.status).toBe(500);
  });
});
