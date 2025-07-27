/**
 * Tests for error utility functions
 */
import { describe, expect, it } from "vitest";

import type { AppError, AuthError, FileSystemError, HttpError, ValidationError } from "@/types/errors";

import {
    extractErrorMessage,
    formatErrorForUser,
    getErrorDetails,
    toAppError,
} from "@/lib/utils/error-utils";

describe("error utilities", () => {
    describe("extractErrorMessage", () => {
        it("should handle null/undefined errors", () => {
            expect(extractErrorMessage(null)).toBe("An unexpected error occurred");
            expect(extractErrorMessage(undefined)).toBe("An unexpected error occurred");
        });

        it("should handle string errors", () => {
            expect(extractErrorMessage("Custom error message")).toBe("Custom error message");
        });

        it("should handle Error objects", () => {
            const error = new Error("Standard error message");
            expect(extractErrorMessage(error)).toBe("Standard error message");
        });

        it("should handle objects with message property", () => {
            const error = { message: "Object error message" };
            expect(extractErrorMessage(error)).toBe("Object error message");
        });

        it("should handle objects with error_description property", () => {
            const error = { error_description: "Auth error description" };
            expect(extractErrorMessage(error)).toBe("Auth error description");
        });

        it("should handle objects with error property", () => {
            const error = { error: "Generic error" };
            expect(extractErrorMessage(error)).toBe("Generic error");
        });

        it("should fallback to string conversion", () => {
            const error = { someProperty: "value" };
            expect(extractErrorMessage(error)).toBe("[object Object]");
        });

        it("should handle conversion failures gracefully", () => {
            const error = {
                toString: () => {
                    throw new Error("Cannot convert");
                },
            };
            expect(extractErrorMessage(error)).toBe("Unknown error occurred");
        });
    });

    describe("toAppError", () => {
        it("should handle null/undefined errors", () => {
            const result = toAppError(null);
            expect(result.type).toBe("generic");
            expect(result.message).toBe("Unknown error occurred");
        });

        it("should return existing AppError unchanged", () => {
            const appError: AppError = {
                type: "http",
                message: "Existing error",
                status: 404,
            };

            const result = toAppError(appError);
            expect(result).toBe(appError);
        });

        it("should convert Response objects to HttpError", () => {
            const mockResponse = {
                status: 404,
                statusText: "Not Found",
                url: "https://example.com/api",
            };

            const result = toAppError(mockResponse) as HttpError;
            expect(result.type).toBe("http");
            expect(result.status).toBe(404);
            expect(result.statusText).toBe("Not Found");
            expect(result.url).toBe("https://example.com/api");
            expect(result.message).toContain("404");
        });

        it("should convert auth errors to AuthError", () => {
            const authError = {
                error: "invalid_credentials",
                error_description: "Invalid username or password",
            };

            const result = toAppError(authError) as AuthError;
            expect(result.type).toBe("auth");
            expect(result.error).toBe("invalid_credentials");
            expect(result.error_description).toBe("Invalid username or password");
            expect(result.message).toBe("Invalid username or password");
        });

        it("should convert filesystem errors to FileSystemError", () => {
            const fsError = new Error("File not found") as Error & { code: string };
            fsError.code = "ENOENT";

            const result = toAppError(fsError) as FileSystemError;
            expect(result.type).toBe("filesystem");
            expect(result.code).toBe("ENOENT");
            expect(result.message).toBe("File not found");
        });

        it("should convert validation errors to ValidationError", () => {
            const validationError = {
                issues: [
                    { path: ["email"], message: "Invalid email", code: "invalid_email" },
                ],
                fieldErrors: { email: ["Invalid email format"] },
            };

            const result = toAppError(validationError) as ValidationError;
            expect(result.type).toBe("validation");
            expect(result.issues).toHaveLength(1);
            expect(result.fieldErrors?.email).toEqual(["Invalid email format"]);
        });

        it("should convert fetch errors to NetworkError", () => {
            const fetchError = new TypeError("Failed to fetch");

            const result = toAppError(fetchError);
            expect(result.type).toBe("network");
            expect(result.message).toBe("Failed to fetch");
        });

        it("should convert string errors to GenericError", () => {
            const result = toAppError("Something went wrong");
            expect(result.type).toBe("generic");
            expect(result.message).toBe("Something went wrong");
        });

        it("should handle unknown types as GenericError", () => {
            const result = toAppError(123);
            expect(result.type).toBe("generic");
            expect(result.message).toBe("Unknown error type");
        });

        it("should include context when provided", () => {
            const result = toAppError("Error message", "user-action");
            expect(result.type).toBe("generic");
            expect((result as any).source).toBe("user-action");
        });
    });

    describe("formatErrorForUser", () => {
        it("should format HTTP errors user-friendly", () => {
            const httpError: HttpError = {
                type: "http",
                message: "HTTP Error",
                status: 404,
            };

            expect(formatErrorForUser(httpError)).toBe("The requested resource was not found");
        });

        it("should format auth errors user-friendly", () => {
            const authError: AuthError = {
                type: "auth",
                message: "Auth error",
                error: "invalid_credentials",
            };

            expect(formatErrorForUser(authError)).toBe("Invalid username or password");
        });

        it("should format filesystem errors user-friendly", () => {
            const fsError: FileSystemError = {
                type: "filesystem",
                message: "File error",
                code: "ENOENT",
            };

            expect(formatErrorForUser(fsError)).toBe("File not found");
        });

        it("should format validation errors", () => {
            const validationError: ValidationError = {
                type: "validation",
                message: "Validation failed",
            };

            expect(formatErrorForUser(validationError)).toBe("Validation failed");
        });

        it("should handle generic errors", () => {
            const genericError: AppError = {
                type: "generic",
                message: "Something went wrong",
            };

            expect(formatErrorForUser(genericError)).toBe("Something went wrong");
        });
    });

    describe("getErrorDetails", () => {
        it("should extract HTTP error details", () => {
            const httpError: HttpError = {
                type: "http",
                message: "HTTP Error",
                status: 500,
                statusText: "Internal Server Error",
                url: "https://api.example.com",
            };

            const details = getErrorDetails(httpError);
            expect(details.type).toBe("http");
            expect(details.status).toBe(500);
            expect(details.statusText).toBe("Internal Server Error");
            expect(details.url).toBe("https://api.example.com");
        });

        it("should extract auth error details", () => {
            const authError: AuthError = {
                type: "auth",
                message: "Auth failed",
                error: "invalid_token",
                error_description: "Token has expired",
            };

            const details = getErrorDetails(authError);
            expect(details.type).toBe("auth");
            expect(details.error).toBe("invalid_token");
            expect(details.error_description).toBe("Token has expired");
        });

        it("should extract filesystem error details", () => {
            const fsError: FileSystemError = {
                type: "filesystem",
                message: "File operation failed",
                code: "EACCES",
                path: "/restricted/file.txt",
                errno: -13,
            };

            const details = getErrorDetails(fsError);
            expect(details.type).toBe("filesystem");
            expect(details.code).toBe("EACCES");
            expect(details.path).toBe("/restricted/file.txt");
            expect(details.errno).toBe(-13);
        });

        it("should extract validation error details", () => {
            const validationError: ValidationError = {
                type: "validation",
                message: "Validation failed",
                fieldErrors: { email: ["Invalid format"] },
                formErrors: ["Form submission failed"],
            };

            const details = getErrorDetails(validationError);
            expect(details.type).toBe("validation");
            expect(details.fieldErrors).toEqual({ email: ["Invalid format"] });
            expect(details.formErrors).toEqual(["Form submission failed"]);
        });

        it("should handle generic error details", () => {
            const genericError: AppError = {
                type: "generic",
                message: "Unknown error",
                originalError: new Error("Original"),
                source: "user-action",
            };

            const details = getErrorDetails(genericError);
            expect(details.type).toBe("generic");
            expect(details.source).toBe("user-action");
            expect(details.originalError).toBeInstanceOf(Error);
        });
    });

    describe("edge cases and integration", () => {
        it("should handle complex nested error objects", () => {
            const complexError = {
                response: {
                    status: 422,
                    statusText: "Unprocessable Entity",
                },
                data: {
                    errors: {
                        email: ["Email is required", "Email must be valid"],
                    },
                },
            };

            const result = toAppError(complexError);
            expect(result.type).toBe("generic");
            expect(result.message).toBeTruthy();
        });

        it("should preserve error timestamps", () => {
            const result = toAppError("Test error");
            expect(result.timestamp).toBeInstanceOf(Date);
        });

        it("should handle circular reference objects safely", () => {
            const circularError: any = { message: "Circular error" };
            circularError.self = circularError;

            const result = toAppError(circularError);
            expect(result.type).toBe("generic");
            expect(result.message).toBe("Circular error");
        });
    });
});
