/**
 * Hybrid logging system for Next.js 15 with edge runtime compatibility
 *
 * Architecture:
 * - Edge Runtime (middleware): Custom structured JSON logger using native APIs
 * - Node.js Runtime (API routes): Full Pino.js with transport capabilities
 * - Shared Interface: Identical API across all contexts for seamless DX
 */

import type { NextRequest } from "next/server";

// Log levels with numeric values for filtering
export const LOG_LEVELS = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
    silent: Infinity,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

// Base log entry structure
export interface LogEntry {
    level: number;
    levelName: LogLevel;
    timestamp: string;
    message: string;
    context?: Record<string, unknown>;
    requestId?: string;
    userId?: string;
    environment: string;
    runtime: "edge" | "nodejs" | "browser";
    [key: string]: unknown;
}

// Logger interface - identical across all implementations
export interface Logger {
    trace: (message: string, context?: Record<string, unknown>) => void;
    debug: (message: string, context?: Record<string, unknown>) => void;
    info: (message: string, context?: Record<string, unknown>) => void;
    warn: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, context?: Record<string, unknown>) => void;
    fatal: (message: string, context?: Record<string, unknown>) => void;
    child: (bindings: Record<string, unknown>) => Logger;
    setLevel: (level: LogLevel) => void;
    isLevelEnabled: (level: LogLevel) => boolean;
}

// Runtime detection utilities
function detectRuntime(): "edge" | "nodejs" | "browser" {
    // Check NEXT_RUNTIME environment variable first (most reliable for Next.js)
    if (typeof process !== "undefined" && process.env?.NEXT_RUNTIME === "edge") {
        return "edge";
    }

    if (typeof process !== "undefined" && process.env?.NEXT_RUNTIME === "nodejs") {
        return "nodejs";
    }

    // Fallback to global checks
    // Edge runtime check - Next.js specific
    if (typeof (globalThis as any).EdgeRuntime !== "undefined") {
        return "edge";
    }

    // Node.js runtime check - but avoid process.versions in Edge Runtime
    if (typeof process !== "undefined" && typeof (globalThis as any).EdgeRuntime === "undefined") {
        try {
            // Only access process.versions if we're not in Edge Runtime
            if (process.versions && process.versions.node) {
                return "nodejs";
            }
        }
        catch {
            // Ignore errors and continue
        }
    }

    // Browser/client-side
    return "browser";
}

// Get environment from various sources
function getEnvironment(): string {
    if (typeof process !== "undefined" && process.env) {
        return process.env.NODE_ENV || "development";
    }
    return "unknown";
}

// Generate request ID from various sources
function generateRequestId(request?: NextRequest): string {
    if (request) {
        // Try to get from headers first
        const existingId = request.headers.get("x-request-id")
            || request.headers.get("cf-ray")
            || request.headers.get("x-vercel-id");
        if (existingId)
            return existingId;
    }

    // Generate a simple unique ID
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Edge Runtime Logger Implementation
class EdgeLogger implements Logger {
    private level: LogLevel;
    private context: Record<string, unknown>;
    private runtime = "edge" as const;
    private environment: string;

    constructor(
        level: LogLevel = "info",
        context: Record<string, unknown> = {},
    ) {
        this.level = level;
        this.context = context;
        this.environment = getEnvironment();
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
    }

    private writeLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
        if (!this.shouldLog(level))
            return;

        const logEntry: LogEntry = {
            level: LOG_LEVELS[level],
            levelName: level,
            timestamp: new Date().toISOString(),
            message,
            context: { ...this.context, ...context },
            environment: this.environment,
            runtime: this.runtime,
        };

        // Use console with structured JSON in edge runtime
        console.log(JSON.stringify(logEntry));
    }

    trace(message: string, context?: Record<string, unknown>): void {
        this.writeLog("trace", message, context);
    }

    debug(message: string, context?: Record<string, unknown>): void {
        this.writeLog("debug", message, context);
    }

    info(message: string, context?: Record<string, unknown>): void {
        this.writeLog("info", message, context);
    }

    warn(message: string, context?: Record<string, unknown>): void {
        this.writeLog("warn", message, context);
    }

    error(message: string, context?: Record<string, unknown>): void {
        this.writeLog("error", message, context);
    }

    fatal(message: string, context?: Record<string, unknown>): void {
        this.writeLog("fatal", message, context);
    }

    child(bindings: Record<string, unknown>): Logger {
        return new EdgeLogger(this.level, { ...this.context, ...bindings });
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    isLevelEnabled(level: LogLevel): boolean {
        return this.shouldLog(level);
    }
}

// Lazy import for Pino to avoid edge runtime issues
let pinoInstance: any = null;
async function getPino() {
    if (!pinoInstance) {
        const pino = await import("pino");
        pinoInstance = pino.default || pino;
    }
    return pinoInstance;
}

// Set max listeners to prevent warnings during builds with multiple loggers
// Only do this in Node.js runtime, not Edge Runtime
if (typeof process !== "undefined"
    && process.env?.NEXT_RUNTIME !== "edge"
    && typeof (globalThis as any).EdgeRuntime === "undefined"
    && process.setMaxListeners) {
    process.setMaxListeners(20); // Increase from default 10 to handle multiple logger instances
}

// Singleton Pino instance to prevent multiple loggers and exit listeners
let globalPinoLogger: any = null;
let pinoInitialized = false;

async function getGlobalPinoLogger(level: LogLevel = "info", context: Record<string, unknown> = {}): Promise<any> {
    if (!globalPinoLogger && !pinoInitialized) {
        pinoInitialized = true;
        try {
            const pino = await getPino();
            const usePretty = process.env.LOG_FORMAT === "pretty";
            const environment = getEnvironment();

            globalPinoLogger = pino({
                level,
                base: {
                    environment,
                    runtime: "nodejs",
                    ...context,
                },
                formatters: {
                    level(label: string, number: number) {
                        return {
                            level: number,
                            levelName: label,
                        };
                    },
                },
                timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
                transport: usePretty
                    ? {
                            target: "pino-pretty",
                            options: {
                                colorize: true,
                                singleLine: true,
                                ignore: "pid,hostname,environment,runtime,context",
                            },
                        }
                    : undefined,
            });
        }
        catch (error) {
            console.error("Failed to initialize global Pino logger:", error);
            globalPinoLogger = null;
        }
    }
    return globalPinoLogger;
}

// Node.js Runtime Logger Implementation with Pino
class NodeLogger implements Logger {
    private level: LogLevel;
    private context: Record<string, unknown>;
    private runtime = "nodejs" as const;
    private environment: string;
    private pino: any = null;
    private initialized = false;

    constructor(
        level: LogLevel = "info",
        context: Record<string, unknown> = {},
    ) {
        this.level = level;
        this.context = context;
        this.environment = getEnvironment();
        this.initializePino();
    }

    private async initializePino(): Promise<void> {
        try {
            this.pino = await getGlobalPinoLogger(this.level, this.context);
            this.initialized = !!this.pino;
        }
        catch (error) {
            console.error("Failed to initialize Pino, falling back to console:", error);
            this.initialized = false;
        }
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
    }

    private writeLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
        if (!this.shouldLog(level))
            return;

        if (this.initialized && this.pino) {
            // Use Pino logger
            const logContext = { ...context };
            this.pino[level](logContext, message);
        }
        else {
            // Fallback to structured console logging
            const logEntry: LogEntry = {
                level: LOG_LEVELS[level],
                levelName: level,
                timestamp: new Date().toISOString(),
                message,
                context: { ...this.context, ...context },
                environment: this.environment,
                runtime: this.runtime,
            };
            console.log(JSON.stringify(logEntry));
        }
    }

    trace(message: string, context?: Record<string, unknown>): void {
        this.writeLog("trace", message, context);
    }

    debug(message: string, context?: Record<string, unknown>): void {
        this.writeLog("debug", message, context);
    }

    info(message: string, context?: Record<string, unknown>): void {
        this.writeLog("info", message, context);
    }

    warn(message: string, context?: Record<string, unknown>): void {
        this.writeLog("warn", message, context);
    }

    error(message: string, context?: Record<string, unknown>): void {
        this.writeLog("error", message, context);
    }

    fatal(message: string, context?: Record<string, unknown>): void {
        this.writeLog("fatal", message, context);
    }

    child(bindings: Record<string, unknown>): Logger {
        if (this.initialized && this.pino) {
            // Create Pino child logger from the shared instance
            const childPino = this.pino.child(bindings);
            const childLogger = new NodeLogger(this.level, { ...this.context, ...bindings });
            childLogger.pino = childPino;
            childLogger.initialized = true;
            return childLogger;
        }
        return new NodeLogger(this.level, { ...this.context, ...bindings });
    }

    setLevel(level: LogLevel): void {
        this.level = level;
        if (this.initialized && this.pino) {
            this.pino.level = level;
        }
    }

    isLevelEnabled(level: LogLevel): boolean {
        return this.shouldLog(level);
    }
}

// Browser/Client Logger Implementation
class BrowserLogger implements Logger {
    private level: LogLevel;
    private context: Record<string, unknown>;
    private runtime = "browser" as const;
    private environment: string;

    constructor(
        level: LogLevel = "info",
        context: Record<string, unknown> = {},
    ) {
        this.level = level;
        this.context = context;
        this.environment = getEnvironment();
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
    }

    private writeLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
        if (!this.shouldLog(level))
            return;

        const logEntry: LogEntry = {
            level: LOG_LEVELS[level],
            levelName: level,
            timestamp: new Date().toISOString(),
            message,
            context: { ...this.context, ...context },
            environment: this.environment,
            runtime: this.runtime,
        };

        // Use appropriate console method for browser
        const consoleMethod = level === "error" || level === "fatal" ? console.error
            : level === "warn" ? console.warn
                : level === "debug" || level === "trace" ? console.debug
                    : console.log;

        consoleMethod(JSON.stringify(logEntry));
    }

    trace(message: string, context?: Record<string, unknown>): void {
        this.writeLog("trace", message, context);
    }

    debug(message: string, context?: Record<string, unknown>): void {
        this.writeLog("debug", message, context);
    }

    info(message: string, context?: Record<string, unknown>): void {
        this.writeLog("info", message, context);
    }

    warn(message: string, context?: Record<string, unknown>): void {
        this.writeLog("warn", message, context);
    }

    error(message: string, context?: Record<string, unknown>): void {
        this.writeLog("error", message, context);
    }

    fatal(message: string, context?: Record<string, unknown>): void {
        this.writeLog("fatal", message, context);
    }

    child(bindings: Record<string, unknown>): Logger {
        return new BrowserLogger(this.level, { ...this.context, ...bindings });
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    isLevelEnabled(level: LogLevel): boolean {
        return this.shouldLog(level);
    }
}

// Logger Factory - Main Entry Point
export function createLogger(
    level: LogLevel = "info",
    context: Record<string, unknown> = {},
): Logger {
    const runtime = detectRuntime();

    switch (runtime) {
        case "edge":
            return new EdgeLogger(level, context);
        case "nodejs":
            return new NodeLogger(level, context);
        case "browser":
            return new BrowserLogger(level, context);
        default:
            // Fallback to edge logger
            return new EdgeLogger(level, context);
    }
}

// Request-aware logger factory
export function createRequestLogger(
    request?: NextRequest,
    level: LogLevel = "info",
    additionalContext: Record<string, unknown> = {},
): Logger {
    const requestId = generateRequestId(request);
    const baseContext = {
        requestId,
        ...additionalContext,
    };

    // Add request-specific context if request is provided
    if (request) {
        Object.assign(baseContext, {
            method: request.method,
            url: request.url,
            userAgent: request.headers.get("user-agent"),
        });
    }

    return createLogger(level, baseContext);
}

// Default logger instance
export const logger = createLogger();

// Convenience method for getting environment-appropriate log level
export function getDefaultLogLevel(): LogLevel {
    const env = getEnvironment();

    switch (env) {
        case "production":
            return "info";
        case "test":
            return "warn";
        case "development":
        default:
            return "debug";
    }
}

// Migration helper - drop-in replacement for console methods
export const log = {
    trace: (message: string, ...args: unknown[]) => {
        const migrationLogger = createLogger();
        migrationLogger.trace(message, { args });
    },
    debug: (message: string, ...args: unknown[]) => {
        const migrationLogger = createLogger();
        migrationLogger.debug(message, { args });
    },
    info: (message: string, ...args: unknown[]) => {
        const migrationLogger = createLogger();
        migrationLogger.info(message, { args });
    },
    log: (message: string, ...args: unknown[]) => {
        const migrationLogger = createLogger();
        migrationLogger.info(message, { args });
    }, // console.log alias
    warn: (message: string, ...args: unknown[]) => {
        const migrationLogger = createLogger();
        migrationLogger.warn(message, { args });
    },
    error: (message: string, ...args: unknown[]) => {
        const migrationLogger = createLogger();
        migrationLogger.error(message, { args });
    },
};
