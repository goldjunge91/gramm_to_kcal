/**
 * Tests for circuit breakers admin API route
 */
import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST, HEAD } from "@/app/api/admin/circuit-breakers/route";

// Mock circuit breaker
const mockCircuitBreaker = {
    reset: vi.fn(),
    forceOpen: vi.fn(),
    forceClose: vi.fn(),
};

// Mock dependencies
vi.mock("@/lib/circuit-breaker", () => ({
    circuitBreakerManager: {
        getAllStatus: vi.fn(),
        getHealthSummary: vi.fn(),
        get: vi.fn(),
        emergencyResetAll: vi.fn(),
        emergencyOpenAll: vi.fn(),
    },
}));

vi.mock("@/lib/validations/request-validation", () => ({
    validateRequest: vi.fn(),
    validateRequestSize: vi.fn(),
    validateContentType: vi.fn(),
    getSecurityHeaders: vi.fn(() => new Headers()),
}));

describe("/api/admin/circuit-breakers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET", () => {
        it("should return circuit breaker status", async () => {
            const { circuitBreakerManager } = await import("@/lib/circuit-breaker");
            
            vi.mocked(circuitBreakerManager.getAllStatus).mockResolvedValue({
                openFoodFacts: { state: "closed", failures: 0, lastFailure: null },
                redis: { state: "closed", failures: 0, lastFailure: null },
            });
            vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue({
                total: 2,
                healthy: 2,
                open: 0,
            });

            const request = new NextRequest("http://localhost:3000/api/admin/circuit-breakers");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.summary).toEqual({ total: 2, healthy: 2, open: 0 });
            expect(data.services).toBeDefined();
            expect(data.timestamp).toBeDefined();
        });

        it("should handle errors when getting status", async () => {
            const { circuitBreakerManager } = await import("@/lib/circuit-breaker");
            
            vi.mocked(circuitBreakerManager.getAllStatus).mockRejectedValue(new Error("Service unavailable"));

            const request = new NextRequest("http://localhost:3000/api/admin/circuit-breakers");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Failed to get circuit breaker status");
            expect(data.details).toBe("Service unavailable");
        });

        it("should log admin access for monitoring", async () => {
            const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
            const { circuitBreakerManager } = await import("@/lib/circuit-breaker");
            
            vi.mocked(circuitBreakerManager.getAllStatus).mockResolvedValue({});
            vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue({
                total: 0, healthy: 0, open: 0,
            });

            const request = new NextRequest("http://localhost:3000/api/admin/circuit-breakers", {
                headers: { "x-forwarded-for": "192.168.1.1" },
            });
            
            await GET(request);

            expect(consoleSpy).toHaveBeenCalledWith("[CIRCUIT-BREAKER] Admin GET request from IP: 192.168.1.1");
            consoleSpy.mockRestore();
        });
    });

    describe("POST", () => {
        it("should reject requests that are too large", async () => {
            const { validateRequestSize, getSecurityHeaders } = await import("@/lib/validations/request-validation");
            
            vi.mocked(validateRequestSize).mockReturnValue(false);
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());

            const request = new NextRequest("http://localhost:3000/api/admin/circuit-breakers", {
                method: "POST",
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(413);
            expect(data.error).toBe("Request too large");
        });

        it("should reset specific service circuit breaker", async () => {
            const { validateRequestSize, validateContentType, validateRequest, getSecurityHeaders } = await import("@/lib/validations/request-validation");
            const { circuitBreakerManager } = await import("@/lib/circuit-breaker");
            
            vi.mocked(validateRequestSize).mockReturnValue(true);
            vi.mocked(validateContentType).mockReturnValue(true);
            vi.mocked(validateRequest).mockResolvedValue({
                success: true,
                data: { action: "reset", service: "openFoodFacts" },
            });
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());
            vi.mocked(circuitBreakerManager.get).mockReturnValue(mockCircuitBreaker);
            vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue({
                total: 2, healthy: 2, open: 0,
            });

            const request = new NextRequest("http://localhost:3000/api/admin/circuit-breakers", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ action: "reset", service: "openFoodFacts" }),
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe("Circuit breaker reset for service: openFoodFacts");
            expect(mockCircuitBreaker.reset).toHaveBeenCalled();
        });

        it("should reset all circuit breakers", async () => {
            const { validateRequestSize, validateContentType, validateRequest, getSecurityHeaders } = await import("@/lib/validations/request-validation");
            const { circuitBreakerManager } = await import("@/lib/circuit-breaker");
            
            vi.mocked(validateRequestSize).mockReturnValue(true);
            vi.mocked(validateContentType).mockReturnValue(true);
            vi.mocked(validateRequest).mockResolvedValue({
                success: true,
                data: { action: "reset" },
            });
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());
            vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue({
                total: 2, healthy: 2, open: 0,
            });

            const request = new NextRequest("http://localhost:3000/api/admin/circuit-breakers", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ action: "reset" }),
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe("All circuit breakers reset");
            expect(circuitBreakerManager.emergencyResetAll).toHaveBeenCalled();
        });

        it("should handle service not found error", async () => {
            const { validateRequestSize, validateContentType, validateRequest, getSecurityHeaders } = await import("@/lib/validations/request-validation");
            const { circuitBreakerManager } = await import("@/lib/circuit-breaker");
            
            vi.mocked(validateRequestSize).mockReturnValue(true);
            vi.mocked(validateContentType).mockReturnValue(true);
            vi.mocked(validateRequest).mockResolvedValue({
                success: true,
                data: { action: "reset", service: "nonexistent" },
            });
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());
            vi.mocked(circuitBreakerManager.get).mockReturnValue(null);

            const request = new NextRequest("http://localhost:3000/api/admin/circuit-breakers", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ action: "reset", service: "nonexistent" }),
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Circuit breaker operation failed");
            expect(data.details).toBe("Service 'nonexistent' not found");
        });

        it("should prevent closing all circuit breakers at once", async () => {
            const { validateRequestSize, validateContentType, validateRequest, getSecurityHeaders } = await import("@/lib/validations/request-validation");
            
            vi.mocked(validateRequestSize).mockReturnValue(true);
            vi.mocked(validateContentType).mockReturnValue(true);
            vi.mocked(validateRequest).mockResolvedValue({
                success: true,
                data: { action: "close" },
            });
            vi.mocked(getSecurityHeaders).mockReturnValue(new Headers());

            const request = new NextRequest("http://localhost:3000/api/admin/circuit-breakers", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ action: "close" }),
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.details).toBe("Closing all circuit breakers at once is not allowed. Please specify a service.");
        });
    });

    describe("HEAD", () => {
        it("should return healthy status when all circuit breakers are healthy", async () => {
            const { circuitBreakerManager } = await import("@/lib/circuit-breaker");
            
            vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue({
                total: 2,
                healthy: 2,
                open: 0,
            });

            const request = new NextRequest("http://localhost:3000/api/admin/circuit-breakers", {
                method: "HEAD",
            });
            
            const response = await HEAD(request);

            expect(response.status).toBe(200);
            expect(response.headers.get("X-Circuit-Breaker-Health")).toBe("healthy");
            expect(response.headers.get("X-Circuit-Breaker-Total")).toBe("2");
            expect(response.headers.get("X-Circuit-Breaker-Healthy")).toBe("2");
        });

        it("should return degraded status when some circuit breakers are open", async () => {
            const { circuitBreakerManager } = await import("@/lib/circuit-breaker");
            
            vi.mocked(circuitBreakerManager.getHealthSummary).mockResolvedValue({
                total: 2,
                healthy: 1,
                open: 1,
            });

            const request = new NextRequest("http://localhost:3000/api/admin/circuit-breakers", {
                method: "HEAD",
            });
            
            const response = await HEAD(request);

            expect(response.status).toBe(503);
            expect(response.headers.get("X-Circuit-Breaker-Health")).toBe("degraded");
        });

        it("should handle errors in HEAD request", async () => {
            const { circuitBreakerManager } = await import("@/lib/circuit-breaker");
            
            vi.mocked(circuitBreakerManager.getHealthSummary).mockRejectedValue(new Error("Service error"));

            const request = new NextRequest("http://localhost:3000/api/admin/circuit-breakers", {
                method: "HEAD",
            });
            
            const response = await HEAD(request);

            expect(response.status).toBe(500);
        });
    });
});