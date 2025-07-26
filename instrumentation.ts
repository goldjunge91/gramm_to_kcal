/**
 * Next.js Instrumentation
 * 
 * This file is called once when a new Next.js server instance is initiated.
 * Use this to initialize services that should only run once per server instance.
 */

export async function register() {
    // Only initialize in Node.js runtime, not Edge Runtime
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await import("./instrumentation-node");
    }
    
    // Edge runtime doesn't need Redis or complex logging setup
    if (process.env.NEXT_RUNTIME === "edge") {
        // Edge runtime initialization can go here if needed
        console.log("Edge runtime initialized");
    }
}

export async function onRequestError(
    error: { digest: string } & Error,
    request: {
        path: string;
        method: string;
        headers: { [key: string]: string };
    },
    context: {
        routerKind: "Pages Router" | "App Router";
        routePath: string;
        routeType: "render" | "route" | "action" | "middleware";
        renderSource: 
            | "react-server-components"
            | "react-server-components-payload"
            | "server-rendering";
        revalidateReason: "on-demand" | "stale" | undefined;
        renderType: "dynamic" | "dynamic-resume";
    }
) {
    // Log the error using our logger system
    try {
        const { createLogger } = await import("./lib/utils/logger");
        const logger = createLogger("error");
        
        logger.error("Request error caught by instrumentation", {
            digest: error.digest,
            message: error.message,
            stack: error.stack,
            request: {
                path: request.path,
                method: request.method,
                userAgent: request.headers["user-agent"],
            },
            context,
        });
    } catch (logError) {
        // Fallback to console if logger fails
        console.error("Instrumentation error logging failed:", logError);
        console.error("Original error:", error);
    }
}