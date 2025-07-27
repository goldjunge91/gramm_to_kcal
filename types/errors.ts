/**
 * Comprehensive error type system for the application
 * Replaces 'any' types with proper discriminated union types
 */

// Base error interface with common properties
interface BaseError {
    message: string;
    timestamp?: Date;
    stack?: string;
}

/**
 * HTTP/API errors from fetch requests
 * Used in React Query, API calls, external service calls
 */
export interface HttpError extends BaseError {
    type: "http";
    status?: number;
    statusText?: string;
    url?: string;
    response?: Response;
}

/**
 * Authentication errors from Better-auth
 * Includes auth-specific error formats
 */
export interface AuthError extends BaseError {
    type: "auth";
    error_description?: string;
    error?: string;
    code?: string;
}

/**
 * Node.js filesystem errors
 * Used in file operations, JSON file handling
 */
export interface FileSystemError extends BaseError {
    type: "filesystem";
    code: string;
    path?: string;
    errno?: number;
    syscall?: string;
}

/**
 * Validation errors from Zod or other validation libraries
 * Structured field-level error information
 */
export interface ValidationError extends BaseError {
    type: "validation";
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
    issues?: Array<{
        path: (string | number)[];
        message: string;
        code: string;
    }>;
}

/**
 * Scanner/hardware errors from QR code scanning, camera access
 * Device-specific error information
 */
export interface ScannerError extends BaseError {
    type: "scanner";
    deviceId?: string;
    reason?: "permission" | "not_found" | "decode_failed" | "camera_error" | "unknown";
    constraints?: MediaTrackConstraints;
}

/**
 * Network errors from connectivity issues
 * Separate from HTTP errors for network-level problems
 */
export interface NetworkError extends BaseError {
    type: "network";
    code?: string;
    reason?: "offline" | "timeout" | "dns_error" | "connection_refused";
}

/**
 * Generic errors for unknown or unexpected error types
 * Fallback when error type cannot be determined
 */
export interface GenericError extends BaseError {
    type: "generic";
    originalError?: unknown;
    source?: string;
}

/**
 * Main discriminated union type for all application errors
 * Use this type instead of 'any' for error handling
 */
export type AppError
    = | HttpError
        | AuthError
        | FileSystemError
        | ValidationError
        | ScannerError
        | NetworkError
        | GenericError;

/**
 * Type guard to check if an error is of a specific type
 */
export function isErrorOfType<T extends AppError["type"]>(
    error: AppError,
    type: T,
): error is Extract<AppError, { type: T }> {
    return error.type === type;
}

/**
 * Type guards for specific error types
 */
export function isHttpError(error: AppError): error is HttpError {
    return isErrorOfType(error, "http");
}

export function isAuthError(error: AppError): error is AuthError {
    return isErrorOfType(error, "auth");
}

export function isFileSystemError(error: AppError): error is FileSystemError {
    return isErrorOfType(error, "filesystem");
}

export function isValidationError(error: AppError): error is ValidationError {
    return isErrorOfType(error, "validation");
}

export function isScannerError(error: AppError): error is ScannerError {
    return isErrorOfType(error, "scanner");
}

export function isNetworkError(error: AppError): error is NetworkError {
    return isErrorOfType(error, "network");
}

export function isGenericError(error: AppError): error is GenericError {
    return isErrorOfType(error, "generic");
}
