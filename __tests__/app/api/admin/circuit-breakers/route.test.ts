/**
 * Tests for circuit breakers admin API route
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, HEAD, POST } from "@/app/api/admin/circuit-breakers/route";
import { CircuitState } from "@/lib/circuit-breaker";

// Mock circuit breaker
const mockCircuitBreaker = {
    reset: vi.fn(),
    forceOpen: vi.fn(),
    forceClose: vi.fn(),
};

// Mock dependencies
vi.mock("@/lib/circuit-breaker", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        circuitBreakerManager: {
            getAllStatus: vi.fn(),
            getHealthSummary: vi.fn(),
            get: vi.fn(),
            emergencyResetAll: vi.fn(),
            emergencyOpenAll: vi.fn(),
        },
    };
});

vi.mock("@/lib/validations/request-validation", () => ({
    validateRequest: vi.fn(),
    validateRequestSize: vi.fn(),
    validateContentType: vi.fn(),
    getSecurityHeaders: vi.fn(() => new Headers()),
}));

// Mock auth with admin session
vi.mock("@/lib/auth/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(() =>
                Promise.resolve({
                    user: {
                        id: "admin-123",
                        email: "admin@test.com",
                        role: "admin",
                    },
                })
            ),
        },
    },
}));

describe("/api/admin/circuit-breakers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET", () => {
        it("should return circuit breaker status", async () => {
            const { circuitBreakerManager } = await import(
                "@/lib/circuit-breaker"
            );

            vi.mocked(circuitBreakerManager.getAllStatus).mockResolvedValue([
                {
                    name: "openFoodFacts",
                    status: {
                        serviceName: "openFoodFacts",
                        state: CircuitState.CLOSED,
                        config: {
                            failureThreshold: 5,
                            recoveryTimeout: 30000,
                            successThreshold: 3,
                            timeout: 10000,
                            monitoringWindow: 60000,
                        },
                        metrics: {
                            failures: 0,
                            successes: 0,
                            lastFailure: undefined,
                            lastSuccess: undefined,
                        },
                        isHealthy: true,
                        canRetry: true,
                    },
                },
                {
                    name: "redis",
                    status: {
                        serviceName: "redis",
                        state: CircuitState.CLOSED,
                        config: {
                            failureThreshold: 3,
                            recoveryTimeout: 10000,
                            successThreshold: 2,
                            timeout: 5000,
                            monitoringWindow: 30000,
                        },
                        metrics: {
                            failures: 0,
                            successes: 0,
                            lastFailure: undefined,
                            lastSuccess: undefined,
                        },
                        isHealthy: true,
                        canRetry: true,
                    },
                },
            ]);
            vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue(
                {
                    total: 2,
                    healthy: 2,
                    open: 0,
                    halfOpen: 0,
                    services: {
                        openFoodFacts: {
                            state: CircuitState.CLOSED,
                            healthy: true,
                            failures: 0,
                            successes: 0,
                        },
                        redis: {
                            state: CircuitState.CLOSED,
                            healthy: true,
                            failures: 0,
                            successes: 0,
                        },
                    },
                },
            );

            const request = new NextRequest(
                "http://localhost:3000/api/admin/circuit-breakers",
            );
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.summary).toMatchObject({ total: 2, healthy: 2, open: 0 });
            expect(data.services).toBeDefined();
            expect(data.timestamp).toBeDefined();
        });

        it("should handle errors when getting status", async () => {
            const { circuitBreakerManager } = await import(
                "@/lib/circuit-breaker"
            );

            vi.mocked(circuitBreakerManager.getAllStatus).mockRejectedValue(
                new Error("Service unavailable"),
            );

            const request = new NextRequest(
                "http://localhost:3000/api/admin/circuit-breakers",
            );
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Failed to get circuit breaker status");
            expect(data.details).toBe("Service unavailable");
        });

        it("should log admin access for monitoring", async () => {
            const consoleSpy = vi
                .spyOn(console, "info")
                .mockImplementation(() => {});
            const { circuitBreakerManager } = await import(
                "@/lib/circuit-breaker"
            );

            vi.mocked(circuitBreakerManager.getAllStatus).mockResolvedValue([]);
            vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue(
                {
                    total: 0,
                    healthy: 0,
                    open: 0,
                    halfOpen: 0,
                    services: {},
                },
            );

            const request = new NextRequest(
                "http://localhost:3000/api/admin/circuit-breakers",
                {
                    headers: { "x-forwarded-for": "192.168.1.1" },
                },
            );

            await GET(request);

            // Verify enhanced admin logging is working
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("[ADMIN-AUTH] Admin access granted: admin@test.com"),
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("[ADMIN-AUDIT]"),
            );
            consoleSpy.mockRestore();
        });
    });

    describe("POST", () => {
        it("should reject requests that are too large", async () => {
            const { validateRequestSize, getSecurityHeaders } = await import(
                "@/lib/validations/request-validation"
            );

            vi.mocked(validateRequestSize).mockReturnValue(false);
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());

            const request = new NextRequest(
                "http://localhost:3000/api/admin/circuit-breakers",
                {
                    method: "POST",
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(413);
            expect(data.error).toBe("Request too large");
        });

        it("should reset specific service circuit breaker", async () => {
            const {
                validateRequestSize,
                validateContentType,
                validateRequest,
                getSecurityHeaders,
            } = await import("@/lib/validations/request-validation");
            const { circuitBreakerManager } = await import(
                "@/lib/circuit-breaker"
            );

            vi.mocked(validateRequestSize).mockReturnValue(true);
            vi.mocked(validateContentType).mockReturnValue(true);
            vi.mocked(validateRequest).mockResolvedValue({
                success: true,
                data: { action: "reset", service: "openFoodFacts" },
            });
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());
            vi.mocked(circuitBreakerManager.get).mockReturnValue(
                mockCircuitBreaker as any,
            );
            vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue(
                {
                    total: 2,
                    healthy: 2,
                    open: 0,
                    halfOpen: 0,
                    services: {},
                },
            );

            const request = new NextRequest(
                "http://localhost:3000/api/admin/circuit-breakers",
                {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        action: "reset",
                        service: "openFoodFacts",
                    }),
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe(
                "Circuit breaker reset for service: openFoodFacts",
            );
            expect(mockCircuitBreaker.reset).toHaveBeenCalled();
        });

        it("should reset all circuit breakers", async () => {
            const {
                validateRequestSize,
                validateContentType,
                validateRequest,
                getSecurityHeaders,
            } = await import("@/lib/validations/request-validation");
            const { circuitBreakerManager } = await import(
                "@/lib/circuit-breaker"
            );

            vi.mocked(validateRequestSize).mockReturnValue(true);
            vi.mocked(validateContentType).mockReturnValue(true);
            vi.mocked(validateRequest).mockResolvedValue({
                success: true,
                data: { action: "reset" },
            });
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());
            vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue(
                {
                    total: 2,
                    healthy: 2,
                    open: 0,
                    halfOpen: 0,
                    services: {},
                },
            );

            const request = new NextRequest(
                "http://localhost:3000/api/admin/circuit-breakers",
                {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ action: "reset" }),
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe("All circuit breakers reset");
            expect(circuitBreakerManager.emergencyResetAll).toHaveBeenCalled();
        });

        it("should handle service not found error", async () => {
            const {
                validateRequestSize,
                validateContentType,
                validateRequest,
                getSecurityHeaders,
            } = await import("@/lib/validations/request-validation");
            const { circuitBreakerManager } = await import(
                "@/lib/circuit-breaker"
            );

            vi.mocked(validateRequestSize).mockReturnValue(true);
            vi.mocked(validateContentType).mockReturnValue(true);
            vi.mocked(validateRequest).mockResolvedValue({
                success: true,
                data: { action: "reset", service: "nonexistent" },
            });
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());
            vi.mocked(circuitBreakerManager.get).mockReturnValue(undefined);

            const request = new NextRequest(
                "http://localhost:3000/api/admin/circuit-breakers",
                {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        action: "reset",
                        service: "nonexistent",
                    }),
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Circuit breaker operation failed");
            expect(data.details).toBe("Service 'nonexistent' not found");
        });

        it("should prevent closing all circuit breakers at once", async () => {
            const {
                validateRequestSize,
                validateContentType,
                validateRequest,
                getSecurityHeaders,
            } = await import("@/lib/validations/request-validation");

            vi.mocked(validateRequestSize).mockReturnValue(true);
            vi.mocked(validateContentType).mockReturnValue(true);
            vi.mocked(validateRequest).mockResolvedValue({
                success: true,
                data: { action: "close" },
            });
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());

            const request = new NextRequest(
                "http://localhost:3000/api/admin/circuit-breakers",
                {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ action: "close" }),
                },
            );

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.details).toBe(
                "Closing all circuit breakers at once is not allowed. Please specify a service.",
            );
        });
    });

    describe("HEAD", () => {
        it("should return healthy status when all circuit breakers are healthy", async () => {
            const { circuitBreakerManager } = await import(
                "@/lib/circuit-breaker"
            );

            vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue(
                {
                    total: 2,
                    healthy: 2,
                    open: 0,
                    halfOpen: 0,
                    services: {},
                },
            );

            const request = new NextRequest(
                "http://localhost:3000/api/admin/circuit-breakers",
                {
                    method: "HEAD",
                },
            );

            const response = await HEAD(request);

            expect(response.status).toBe(200);
            expect(response.headers.get("X-Circuit-Breaker-Health")).toBe(
                "healthy",
            );
            expect(response.headers.get("X-Circuit-Breaker-Total")).toBe("2");
            expect(response.headers.get("X-Circuit-Breaker-Healthy")).toBe("2");
        });

        it("should return degraded status when some circuit breakers are open", async () => {
            const { circuitBreakerManager } = await import(
                "@/lib/circuit-breaker"
            );

            vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue(
                {
                    total: 2,
                    healthy: 1,
                    open: 1,
                    halfOpen: 0,
                    services: {},
                },
            );

            const request = new NextRequest(
                "http://localhost:3000/api/admin/circuit-breakers",
                {
                    method: "HEAD",
                },
            );

            const response = await HEAD(request);

            expect(response.status).toBe(503);
            expect(response.headers.get("X-Circuit-Breaker-Health")).toBe(
                "degraded",
            );
        });

        it("should handle errors in HEAD request", async () => {
            const { circuitBreakerManager } = await import(
                "@/lib/circuit-breaker"
            );

            vi.mocked(circuitBreakerManager.getHealthSummary).mockRejectedValue(
                new Error("Service error"),
            );

            const request = new NextRequest(
                "http://localhost:3000/api/admin/circuit-breakers",
                {
                    method: "HEAD",
                },
            );

            const response = await HEAD(request);

            expect(response.status).toBe(500);
        });
    });
});
