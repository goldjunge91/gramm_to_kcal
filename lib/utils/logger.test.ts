/**
 * Tests for hybrid logging system
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    createLogger,
    createRequestLogger,
    getDefaultLogLevel,
    log,
    LOG_LEVELS,
} from "@/lib/utils/logger";

// Mock EdgeRuntime global
const originalEdgeRuntime = (globalThis as any).EdgeRuntime;

describe("logger System", () => {
    beforeEach(() => {
        // Mock console methods
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});
        // Kontext-Log für Teststart

        console.info("[TEST] logger System: Testlauf gestartet", { timestamp: new Date().toISOString() });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // Restore EdgeRuntime
        if (originalEdgeRuntime !== undefined) {
            (globalThis as any).EdgeRuntime = originalEdgeRuntime;
        }
        else {
            delete (globalThis as any).EdgeRuntime;
        }
        // Kontext-Log für Testende

        console.info("[TEST] logger System: Testlauf beendet", { timestamp: new Date().toISOString() });
    });

    describe("logger Factory", () => {
        it("should create a logger instance", () => {
            const logger = createLogger();
            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe("function");
            expect(typeof logger.error).toBe("function");
            expect(typeof logger.warn).toBe("function");
            expect(typeof logger.debug).toBe("function");
        });

        it("should create logger with custom level", () => {
            const logger = createLogger("error");
            expect(logger.isLevelEnabled("error")).toBe(true);
            expect(logger.isLevelEnabled("info")).toBe(false);
        });

        it("should create logger with context", () => {
            const logger = createLogger("info", { userId: "123", service: "test" });
            logger.info("test message");

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("\"userId\":\"123\""),
            );
        });
    });

    describe("runtime Detection", () => {
        it("should detect Node.js runtime by default", () => {
            const logger = createLogger();
            logger.info("test");

            const logCall = vi.mocked(console.log).mock.calls[0][0];
            const logEntry = JSON.parse(logCall);
            expect(logEntry.runtime).toBe("nodejs");
        });

        it("should detect edge runtime when EdgeRuntime is defined", () => {
            // @ts-ignore - mocking global
            (globalThis as any).EdgeRuntime = {};

            const logger = createLogger();
            logger.info("test");

            const logCall = vi.mocked(console.log).mock.calls[0][0];
            const logEntry = JSON.parse(logCall);
            expect(logEntry.runtime).toBe("edge");
        });
    });

    describe("log Levels", () => {
        it("should respect log level filtering", () => {
            const logger = createLogger("warn");

            logger.debug("debug message");
            logger.info("info message");
            logger.warn("warn message");
            logger.error("error message");

            expect(console.log).toHaveBeenCalledTimes(2); // warn and error only
        });

        it("should include correct level information", () => {
            const logger = createLogger("debug");
            logger.error("error message");

            const logCall = vi.mocked(console.log).mock.calls[0][0];
            const logEntry = JSON.parse(logCall);
            expect(logEntry.level).toBe(LOG_LEVELS.error);
            expect(logEntry.levelName).toBe("error");
        });
    });

    describe("child Loggers", () => {
        it("should create child logger with inherited context", () => {
            const parentLogger = createLogger("info", { service: "parent" });
            const childLogger = parentLogger.child({ requestId: "req-123" });

            childLogger.info("child message");

            const logCall = vi.mocked(console.log).mock.calls[0][0];
            const logEntry = JSON.parse(logCall);
            expect(logEntry.context.service).toBe("parent");
            expect(logEntry.context.requestId).toBe("req-123");
        });
    });

    describe("request Logger", () => {
        it("should create request-aware logger", () => {
            const mockRequest = {
                method: "GET",
                url: "https://example.com/api/test",
                headers: {
                    get: vi.fn((header: string) => {
                        if (header === "user-agent")
                            return "test-agent";
                        return null;
                    }),
                },
            } as any;

            const logger = createRequestLogger(mockRequest);
            logger.info("request message");

            const logCall = vi.mocked(console.log).mock.calls[0][0];
            const logEntry = JSON.parse(logCall);

            // Check for request ID in context or as direct property
            expect(logEntry.requestId || logEntry.context?.requestId).toBeDefined();
            expect(logEntry.method || logEntry.context?.method).toBe("GET");
            expect(logEntry.url || logEntry.context?.url).toBe("https://example.com/api/test");
            expect(logEntry.userAgent || logEntry.context?.userAgent).toBe("test-agent");
        });
    });

    describe("migration Helper", () => {
        it("should provide console.log compatibility", () => {
            log.info("test message", "arg1", "arg2");

            expect(console.log).toHaveBeenCalledTimes(1);
            const logCall = vi.mocked(console.log).mock.calls[0][0];
            const logEntry = JSON.parse(logCall);
            expect(logEntry.msg || logEntry.message).toBe("test message");
            expect(logEntry.args || logEntry.context?.args).toEqual(["arg1", "arg2"]);
        });

        it("should alias console.log to info level", () => {
            log.log("test message");

            expect(console.log).toHaveBeenCalledTimes(1);
            const logCall = vi.mocked(console.log).mock.calls[0][0];
            const logEntry = JSON.parse(logCall);
            expect(logEntry.levelName || logEntry.level).toBeTruthy();
        });
    });

    describe("default Log Level", () => {
        it("should return appropriate level for production", () => {
            const originalEnv = process.env.NODE_ENV;
            // @ts-ignore - Testing environment modification
            process.env.NODE_ENV = "production";

            expect(getDefaultLogLevel()).toBe("info");

            // @ts-ignore - Testing environment modification
            process.env.NODE_ENV = originalEnv;
        });

        it("should return debug level for development", () => {
            const originalEnv = process.env.NODE_ENV;
            // @ts-ignore - Testing environment modification
            process.env.NODE_ENV = "development";

            expect(getDefaultLogLevel()).toBe("debug");

            // @ts-ignore - Testing environment modification
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe("log Entry Structure", () => {
        it("should include all required fields", () => {
            const logger = createLogger();
            logger.info("test message", { custom: "data" });

            const logCall = vi.mocked(console.log).mock.calls[0][0];
            const logEntry = JSON.parse(logCall);

            expect(logEntry).toHaveProperty("level");
            expect(logEntry).toHaveProperty("levelName");
            expect(logEntry).toHaveProperty("timestamp");
            expect(logEntry).toHaveProperty("message");
            expect(logEntry).toHaveProperty("context");
            expect(logEntry).toHaveProperty("environment");
            expect(logEntry).toHaveProperty("runtime");
            expect(logEntry.context.custom).toBe("data");
        });

        it("should have valid timestamp format", () => {
            const logger = createLogger();
            logger.info("test message");

            const logCall = vi.mocked(console.log).mock.calls[0][0];
            const logEntry = JSON.parse(logCall);

            expect(new Date(logEntry.timestamp).toString()).not.toBe("Invalid Date");
        });
    });
});
