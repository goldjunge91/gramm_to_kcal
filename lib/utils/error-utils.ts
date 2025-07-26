/**
 * Error utility functions for type-safe error handling
 * Use these instead of direct 'any' error manipulation
 */

import type {
    AppError,
    AuthError,
    FileSystemError,
    GenericError,
    HttpError,
    NetworkError,
    ValidationError,
} from "../types/errors";

/**
 * Safely extracts an error message from unknown error types
 * Replaces: error?.message || error?.toString() || "Unknown error"
 */
export function extractErrorMessage(error: unknown): string {
    if (!error)
        return "An unexpected error occurred";

    if (typeof error === "string")
        return error;

    if (error instanceof Error)
        return error.message;

    if (typeof error === "object" && error !== null) {
        const errorObj = error as Record<string, unknown>;

        // Check common error message properties
        if (typeof errorObj.message === "string")
            return errorObj.message;
        if (typeof errorObj.error_description === "string")
            return errorObj.error_description;
        if (typeof errorObj.error === "string")
            return errorObj.error;
    }

    // Fallback to string conversion
    try {
        return String(error);
    }
    catch {
        return "Unknown error occurred";
    }
}

/**
 * Converts unknown error to AppError with proper typing
 * Use this to replace 'any' error parameters
 */
export function toAppError(error: unknown, context?: string): AppError {
    if (!error) {
        return createGenericError("Unknown error occurred", error, context);
    }

    // Already an AppError
    if (isAppError(error)) {
        return error;
    }

    // HTTP Response errors
    if (error instanceof Response || (typeof error === "object" && error !== null && "status" in error)) {
        return toHttpError(error);
    }

    // Standard JavaScript Error
    if (error instanceof Error) {
        // Check if it's a filesystem error (Node.js)
        if ("code" in error && typeof (error as any).code === "string") {
            return toFileSystemError(error as Error & { code: string });
        }

        // Check if it's a network error
        if (error.name === "TypeError" && error.message.includes("fetch")) {
            return toNetworkError(error);
        }

        return createGenericError(error.message, error, context, error.stack);
    }

    // Object with error properties
    if (typeof error === "object" && error !== null) {
        const errorObj = error as Record<string, unknown>;

        // Better-auth error format
        if ("error_description" in errorObj || "error" in errorObj) {
            return toAuthError(errorObj);
        }

        // Validation error format (Zod-like)
        if ("issues" in errorObj || "fieldErrors" in errorObj) {
            return toValidationError(errorObj);
        }

        // Generic object error
        return createGenericError(extractErrorMessage(error), error, context);
    }

    // String error
    if (typeof error === "string") {
        return createGenericError(error, error, context);
    }

    // Fallback for any other type
    return createGenericError("Unknown error type", error, context);
}

/**
 * Type guard to check if error is already an AppError
 */
function isAppError(error: unknown): error is AppError {
    return typeof error === "object"
        && error !== null
        && "type" in error
        && typeof (error as any).type === "string";
}

/**
 * Converts Response or response-like object to HttpError
 */
function toHttpError(error: unknown): HttpError {
    const response = error as Response | { status?: number; statusText?: string; url?: string };

    return {
        type: "http",
        message: `HTTP Error: ${response.status || "Unknown"} ${response.statusText || ""}`.trim(),
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        response: error instanceof Response ? error : undefined,
        timestamp: new Date(),
    };
}

/**
 * Converts auth error object to AuthError
 */
function toAuthError(errorObj: Record<string, unknown>): AuthError {
    const error_description = typeof errorObj.error_description === "string" ? errorObj.error_description : undefined;
    const error = typeof errorObj.error === "string" ? errorObj.error : undefined;
    const code = typeof errorObj.code === "string" ? errorObj.code : undefined;

    return {
        type: "auth",
        message: error_description || error || extractErrorMessage(errorObj),
        error_description,
        error,
        code,
        timestamp: new Date(),
    };
}

/**
 * Converts Node.js filesystem error to FileSystemError
 */
function toFileSystemError(error: Error & { code: string }): FileSystemError {
    return {
        type: "filesystem",
        message: error.message,
        code: error.code,
        path: (error as any).path,
        errno: (error as any).errno,
        syscall: (error as any).syscall,
        stack: error.stack,
        timestamp: new Date(),
    };
}

/**
 * Converts validation error object to ValidationError
 */
function toValidationError(errorObj: Record<string, unknown>): ValidationError {
    return {
        type: "validation",
        message: extractErrorMessage(errorObj),
        fieldErrors: typeof errorObj.fieldErrors === "object" ? errorObj.fieldErrors as Record<string, string[]> : undefined,
        formErrors: Array.isArray(errorObj.formErrors) ? errorObj.formErrors as string[] : undefined,
        issues: Array.isArray(errorObj.issues) ? errorObj.issues as Array<{ path: (string | number)[]; message: string; code: string }> : undefined,
        timestamp: new Date(),
    };
}

/**
 * Converts network error to NetworkError
 */
function toNetworkError(error: Error): NetworkError {
    let reason: NetworkError["reason"];

    if (error.message.includes("Failed to fetch"))
        reason = "connection_refused";
    if (error.message.includes("timeout"))
        reason = "timeout";
    if (error.message.includes("offline"))
        reason = "offline";

    return {
        type: "network",
        message: error.message,
        reason,
        stack: error.stack,
        timestamp: new Date(),
    };
}

/**
 * Creates a generic error
 */
function createGenericError(message: string, originalError: unknown, source?: string, stack?: string): GenericError {
    return {
        type: "generic",
        message,
        originalError,
        source,
        stack,
        timestamp: new Date(),
    };
}

/**
 * Formats error for display to users
 * Sanitizes technical details and provides user-friendly messages
 */
export function formatErrorForUser(error: AppError): string {
    switch (error.type) {
        case "http":
            if (error.status === 404)
                return "The requested resource was not found";
            if (error.status === 401)
                return "Authentication required";
            if (error.status === 403)
                return "Access denied";
            if (error.status === 500)
                return "Server error occurred";
            if (error.status && error.status >= 400)
                return "Request failed";
            return "Network error occurred";

        case "auth":
            if (error.error_description)
                return error.error_description;
            if (error.error === "invalid_credentials")
                return "Invalid username or password";
            if (error.error === "user_not_found")
                return "User not found";
            return "Authentication error occurred";

        case "filesystem":
            if (error.code === "ENOENT")
                return "File not found";
            if (error.code === "EACCES")
                return "Permission denied";
            if (error.code === "EEXIST")
                return "File already exists";
            return "File operation failed";

        case "validation":
            return error.message || "Please check your input and try again";

        case "scanner":
            if (error.reason === "permission")
                return "Camera permission required";
            if (error.reason === "not_found")
                return "No camera found";
            if (error.reason === "decode_failed")
                return "Could not read barcode";
            return "Scanner error occurred";

        case "network":
            if (error.reason === "offline")
                return "Please check your internet connection";
            if (error.reason === "timeout")
                return "Request timed out";
            return "Network error occurred";

        case "generic":
        default:
            return error.message || "An unexpected error occurred";
    }
}

/**
 * Gets error details for logging/debugging
 * Includes technical information for developers
 */
export function getErrorDetails(error: AppError): Record<string, unknown> {
    const base = {
        type: error.type,
        message: error.message,
        timestamp: error.timestamp,
    };

    switch (error.type) {
        case "http":
            return {
                ...base,
                status: error.status,
                statusText: error.statusText,
                url: error.url,
            };

        case "auth":
            return {
                ...base,
                error: error.error,
                error_description: error.error_description,
                code: error.code,
            };

        case "filesystem":
            return {
                ...base,
                code: error.code,
                path: error.path,
                errno: error.errno,
                syscall: error.syscall,
            };

        case "validation":
            return {
                ...base,
                fieldErrors: error.fieldErrors,
                formErrors: error.formErrors,
                issues: error.issues,
            };

        case "scanner":
            return {
                ...base,
                deviceId: error.deviceId,
                reason: error.reason,
                constraints: error.constraints,
            };

        case "network":
            return {
                ...base,
                code: error.code,
                reason: error.reason,
            };

        case "generic":
            return {
                ...base,
                source: error.source,
                originalError: error.originalError,
            };

        default:
            return base;
    }
}
