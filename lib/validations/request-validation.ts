/**
 * Comprehensive request validation and sanitization
 * Protects against XSS, injection attacks, and malformed data
 */

import type { NextRequest } from "next/server";

import { z } from "zod";

// Common validation schemas
export const CommonSchemas = {
    // Barcode validation (EAN13)
    barcode: z
        .string()
        .regex(/^\d{13}$/, "Invalid barcode format")
        .refine(isValidEAN13, "Invalid EAN13 checksum"),

    // Email validation with domain filtering
    email: z
        .string()
        .email("Invalid email format")
        .min(3)
        .max(254)
        .refine(
            email => !isDisposableEmail(email),
            "Disposable emails not allowed",
        ),

    // Safe string validation (prevents XSS)
    safeString: z
        .string()
        .min(1)
        .max(1000)
        .refine(
            str => !containsXSSPatterns(str),
            "Potentially unsafe content detected",
        ),

    // Product name validation
    productName: z
        .string()
        .min(1, "Product name required")
        .max(200, "Product name too long")
        .refine(
            str => !containsXSSPatterns(str),
            "Invalid characters in product name",
        ),

    // Numeric validation
    positiveNumber: z
        .number()
        .positive("Must be a positive number")
        .finite("Must be a finite number"),

    // Search query validation
    searchQuery: z
        .string()
        .min(2, "Search query too short")
        .max(100, "Search query too long")
        .refine(str => !containsSQLInjection(str), "Invalid search query"),

    // IP address validation
    ipAddress: z.string().refine(isValidIP, "Invalid IP address"),

    // User agent validation
    userAgent: z
        .string()
        .max(512, "User agent too long")
        .refine(str => !isSuspiciousUserAgent(str), "Suspicious user agent"),
} as const;

// Request validation schemas for different endpoints
export const RequestSchemas = {
    // Product API schemas
    createProduct: z.object({
        name: CommonSchemas.productName,
        quantity: CommonSchemas.positiveNumber,
        kcal: CommonSchemas.positiveNumber,
    }),

    updateProduct: z.object({
        id: z.string().uuid("Invalid product ID"),
        name: CommonSchemas.productName.optional(),
        quantity: CommonSchemas.positiveNumber.optional(),
        kcal: CommonSchemas.positiveNumber.optional(),
    }),

    // Barcode lookup schema
    barcodeQuery: z.object({
        barcode: CommonSchemas.barcode,
    }),

    // Search schema
    searchQuery: z.object({
        q: CommonSchemas.searchQuery,
        limit: z.number().min(1).max(50).optional().default(10),
    }),

    // Auth schemas
    signIn: z.object({
        email: CommonSchemas.email,
        password: z
            .string()
            .min(8, "Password too short")
            .max(128, "Password too long"),
    }),

    signUp: z.object({
        email: CommonSchemas.email,
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(128, "Password too long")
            .refine(isStrongPassword, "Password not strong enough"),
    }),

    passwordReset: z.object({
        email: CommonSchemas.email,
    }),
} as const;

// Validation helper functions
function isValidEAN13(barcode: string): boolean {
    if (!/^\d{13}$/.test(barcode))
        return false;

    const digits = barcode.split("").map(Number);
    const checksum = digits.pop()!;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }

    const calculatedChecksum = (10 - (sum % 10)) % 10;
    return calculatedChecksum === checksum;
}

function isDisposableEmail(email: string): boolean {
    const disposableDomains = [
        "10minutemail.com",
        "tempmail.org",
        "guerrillamail.com",
        "mailinator.com",
        "throwaway.email",
        // Add more disposable email domains as needed
    ];

    const domain = email.split("@")[1]?.toLowerCase();
    return disposableDomains.includes(domain);
}

function containsXSSPatterns(str: string): boolean {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /<link/gi,
        /<style/gi,
        /expression\s*\(/gi,
        /vbscript:/gi,
        /data:text\/html/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(str));
}

function containsSQLInjection(str: string): boolean {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(;\s*--)/g,
        /('\s*(OR|AND)\s*')/gi,
        /(\bUNION\s+SELECT\b)/gi,
    ];

    return sqlPatterns.some(pattern => pattern.test(str));
}

function isValidIP(ip: string): boolean {
    // Simple IPv4 validation
    const ipv4Regex
        = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})$/;

    // Simple IPv6 validation (basic)
    const ipv6Regex = /^(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === "unknown";
}

function isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
        /sqlmap/i,
        /nikto/i,
        /nmap/i,
        /masscan/i,
        /whatweb/i,
        /dirb/i,
        /dirbuster/i,
        /gobuster/i,
        /wpscan/i,
        /burp/i,
        /scanner/i,
        /hack/i,
        /exploit/i,
        /injection/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

function isStrongPassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return strongPasswordRegex.test(password);
}

// Request sanitization functions
export function sanitizeString(input: string): string {
    return input
        .trim()
        .replaceAll(/[<>]/g, "") // Remove angle brackets
        .replaceAll(/javascript:/gi, "") // Remove javascript: protocol
        .replaceAll(/on\w+\s*=/gi, "") // Remove event handlers
        .slice(0, 1000); // Limit length
}

export function sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

export function sanitizeSearchQuery(query: string): string {
    return query
        .trim()
        .replaceAll(/[^\w\s-]/g, "") // Keep only alphanumeric, spaces, and hyphens
        .slice(0, 100);
}

// Request validation middleware
export async function validateRequest<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>,
    options: {
        source?: "body" | "query" | "params";
        sanitize?: boolean;
    } = {},
): Promise<{ success: true; data: T } | { success: false; error: string }> {
    const { source = "body", sanitize = true } = options;

    try {
        let data: any;

        switch (source) {
            case "body":
                try {
                    data = await request.json();
                }
                catch {
                    return {
                        success: false,
                        error: "Invalid JSON in request body",
                    };
                }
                break;

            case "query": {
                const url = new URL(request.url);
                data = Object.fromEntries(url.searchParams.entries());
                // Konvertiere numerische Query-Parameter
                if (data.limit !== undefined) {
                    const parsed = Number(data.limit);
                    data.limit = Number.isNaN(parsed) ? data.limit : parsed;
                }
                break;
            }

            case "params":
                // For params, we'd need to pass them separately
                return {
                    success: false,
                    error: "Params validation not implemented in this context",
                };
        }

        // Sanitize strings if requested
        if (sanitize) {
            data = sanitizeObject(data);
        }

        // Validate with schema
        const result = schema.safeParse(data);

        if (!result.success) {
            const errorMessage = result.error.issues
                .map(err => `${err.path.join(".")}: ${err.message}`)
                .join(", ");

            return { success: false, error: errorMessage };
        }

        return { success: true, data: result.data };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Validation failed",
        };
    }
}

// Recursive object sanitization
function sanitizeObject(obj: any): any {
    if (typeof obj === "string") {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === "object") {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }

    return obj;
}

// Security headers for responses
export function getSecurityHeaders(): Headers {
    const headers = new Headers();

    // XSS Protection
    headers.set("X-XSS-Protection", "1; mode=block");

    // Content Type Options
    headers.set("X-Content-Type-Options", "nosniff");

    // Frame Options
    headers.set("X-Frame-Options", "DENY");

    // Referrer Policy
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Content Security Policy (basic)
    headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    );

    return headers;
}

// Request size validation
export function validateRequestSize(
    request: NextRequest,
    maxSize: number = 1024 * 1024,
): boolean {
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number.parseInt(contentLength, 10) > maxSize) {
        return false;
    }
    return true;
}

// Content type validation
export function validateContentType(
    request: NextRequest,
    allowedTypes: string[] = ["application/json"],
): boolean {
    const contentType = request.headers.get("content-type");
    if (!contentType)
        return true; // Allow requests without content-type for GET requests

    return allowedTypes.some(type => contentType.includes(type));
}
