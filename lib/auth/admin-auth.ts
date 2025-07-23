/**
 * Admin Authorization Utilities
 * Provides role-based access control for administrative functions
 */

import type { NextRequest } from "next/server";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";

// Admin role configuration
export const ADMIN_ROLES = ["admin", "super_admin"] as const;
export type AdminRole = typeof ADMIN_ROLES[number];

// Admin authorization result
export interface AdminAuthResult {
    authorized: boolean;
    user?: {
        id: string;
        email: string;
        role: string;
    };
    error?: string;
    correlationId: string;
}

// Generate correlation ID for audit logging
function generateCorrelationId(): string {
    return `admin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Verify if user has admin privileges
 */
export async function verifyAdminAccess(request: NextRequest): Promise<AdminAuthResult> {
    const correlationId = generateCorrelationId();

    try {
        // Extract session from Better Auth server-side
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return {
                authorized: false,
                error: "No active session",
                correlationId,
            };
        }

        const user = session.user;

        // Check if user has admin role
        if (!user.role || !ADMIN_ROLES.includes(user.role as AdminRole)) {
            // Log unauthorized access attempt
            console.warn(`[ADMIN-AUTH] Unauthorized admin access attempt: ${user.email} (Role: ${user.role || "none"}) - Correlation: ${correlationId}`);

            return {
                authorized: false,
                error: `Insufficient privileges. Required role: ${ADMIN_ROLES.join(" or ")}`,
                correlationId,
            };
        }

        // Log successful admin access
        console.info(`[ADMIN-AUTH] Admin access granted: ${user.email} (Role: ${user.role}) - Correlation: ${correlationId}`);

        return {
            authorized: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            correlationId,
        };
    }
    catch (error) {
        console.error(`[ADMIN-AUTH] Authorization check failed - Correlation: ${correlationId}`, error);

        return {
            authorized: false,
            error: "Authorization check failed",
            correlationId,
        };
    }
}

/**
 * Admin authorization middleware wrapper
 * Use this to protect admin API routes
 */
export function withAdminAuth<T extends any[]>(
    handler: (request: NextRequest, authResult: AdminAuthResult, ...args: T) => Promise<NextResponse>,
) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
        const authResult = await verifyAdminAccess(request);

        if (!authResult.authorized) {
            // Log the unauthorized attempt with request details
            const ip = request.headers.get("x-forwarded-for")
                || request.headers.get("x-real-ip")
                || "unknown";
            const userAgent = request.headers.get("user-agent") || "unknown";

            console.warn(`[ADMIN-AUTH] Blocked unauthorized admin request from IP: ${ip}, UA: ${userAgent}, Path: ${request.nextUrl.pathname} - Correlation: ${authResult.correlationId}`);

            return NextResponse.json(
                {
                    error: "Forbidden",
                    message: authResult.error,
                    correlationId: authResult.correlationId,
                },
                { status: 403 },
            );
        }

        // Pass the auth result to the handler for additional context
        return handler(request, authResult, ...args);
    };
}

/**
 * Audit logging for admin actions
 */
export interface AdminAuditLog {
    correlationId: string;
    adminUserId: string;
    adminEmail: string;
    action: string;
    resource: string;
    success: boolean;
    details?: Record<string, any>;
    timestamp: string;
    ip?: string;
    userAgent?: string;
}

export function logAdminAction(
    authResult: AdminAuthResult,
    request: NextRequest,
    action: string,
    resource: string,
    success: boolean,
    details?: Record<string, any>,
): void {
    if (!authResult.user)
        return;

    const auditLog: AdminAuditLog = {
        correlationId: authResult.correlationId,
        adminUserId: authResult.user.id,
        adminEmail: authResult.user.email,
        action,
        resource,
        success,
        details,
        timestamp: new Date().toISOString(),
        ip: request.headers.get("x-forwarded-for")
            || request.headers.get("x-real-ip")
            || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
    };

    // For now, log to console - in production, this should go to a secure audit log system
    console.info(`[ADMIN-AUDIT] ${JSON.stringify(auditLog)}`);
}
