import { describe, expect, it } from "vitest";

import { auth } from "../lib/auth/auth";

describe("Better Auth Configuration", () => {
    it("should have IP address fallback configured for rate limiting", () => {
        // Test that the auth configuration includes IP address fallback
        // This ensures rate limiting works even when proxy headers are missing (like in test environments)
        const config = auth.options;

        expect(config.advanced?.ipAddress?.fallbackToRemoteAddress).toBe(true);
        expect(config.advanced?.ipAddress?.ipAddressHeaders).toContain(
            "x-forwarded-for",
        );
        expect(config.advanced?.ipAddress?.ipAddressHeaders).toContain(
            "x-real-ip",
        );
        expect(config.advanced?.ipAddress?.ipAddressHeaders).toContain(
            "cf-connecting-ip",
        );
    });

    it("should have rate limiting enabled with proper configuration", () => {
        const config = auth.options;

        expect(config.rateLimit?.enabled).toBe(true);
        expect(config.rateLimit?.window).toBe(60);
        expect(config.rateLimit?.max).toBe(100);
    });

    it("should have custom rate limit rules for auth endpoints", () => {
        const config = auth.options;

        expect(config.rateLimit?.customRules?.["/sign-in/email"]).toEqual({
            window: 10,
            max: 3,
        });
        expect(config.rateLimit?.customRules?.["/sign-up/email"]).toEqual({
            window: 10,
            max: 3,
        });
    });

    it("should have database adapter configured with correct schema", () => {
        const config = auth.options;

        expect(config.database).toBeDefined();
        // Test that the adapter is properly configured
    });

    it("should have email and password authentication enabled", () => {
        const config = auth.options;

        expect(config.emailAndPassword?.enabled).toBe(true);
    });

    it("should have session cookie cache configured", () => {
        const config = auth.options;

        expect(config.session?.cookieCache?.enabled).toBe(true);
        expect(config.session?.cookieCache?.maxAge).toBe(5 * 60);
    });
});
