/**
 * Node.js Runtime Instrumentation
 * 
 * Initialize services that require Node.js runtime features:
 * - Redis connections
 * - Pino logger setup
 * - Process listeners configuration
 */

import { createLogger } from "./lib/utils/logger";

const logger = createLogger("info", { component: "instrumentation" });

// Initialize Redis connection
async function initializeRedisInstrumentation() {
    try {
        const { initializeRedis } = await import("./lib/redis");
        const redis = initializeRedis();
        
        if (redis) {
            logger.info("Redis initialized successfully during instrumentation");
        } else {
            logger.info("Redis initialization skipped - not configured");
        }
    } catch (error) {
        logger.error("Failed to initialize Redis during instrumentation", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
    }
}

// Initialize process listeners and cleanup handlers
function initializeProcessHandlers() {
    // Graceful shutdown handlers
    const cleanup = () => {
        logger.info("Server shutting down gracefully");
        // Add any cleanup logic here
        process.exit(0);
    };

    process.on("SIGTERM", cleanup);
    process.on("SIGINT", cleanup);
    
    // Unhandled rejection handler
    process.on("unhandledRejection", (reason, promise) => {
        logger.error("Unhandled Promise Rejection", {
            reason: String(reason),
            promise: String(promise),
        });
    });

    // Uncaught exception handler
    process.on("uncaughtException", (error) => {
        logger.fatal("Uncaught Exception", {
            error: error.message,
            stack: error.stack,
        });
        process.exit(1);
    });
}

// Main initialization function
async function initialize() {
    logger.info("Initializing Node.js runtime instrumentation");
    
    // Initialize services
    await initializeRedisInstrumentation();
    initializeProcessHandlers();
    
    logger.info("Node.js runtime instrumentation completed");
}

// Run initialization
initialize().catch((error) => {
    console.error("Failed to initialize Node.js instrumentation:", error);
    process.exit(1);
});