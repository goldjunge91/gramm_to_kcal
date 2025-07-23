import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, anonymous } from "better-auth/plugins";

import { db } from "@/lib/db";
import {
    account,
    session,
    user,
    verification,
} from "@/lib/db/schemas";
import { env } from "@/lib/env";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // PostgreSQL
        schema: {
            user,
            session,
            account,
            verification,
        },
    }),
    emailAndPassword: {
        enabled: true,
        // autoSignIn: false, // defaults to true

    },
    socialProviders: env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
        ? {
                google: {
                    clientId: env.AUTH_GOOGLE_ID,
                    clientSecret: env.AUTH_GOOGLE_SECRET,
                },
            }
        : {},
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes cache
        },
    },
    advanced: {
        ipAddress: {
            ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
            fallbackToRemoteAddress: true,
        },
    },
    rateLimit: {
        enabled: true,
        window: 60, // 60 seconds
        max: 100, // 100 requests per window
        customRules: {
            "/sign-in/email": {
                window: 10,
                max: 3,
            },
            "/sign-up/email": {
                window: 10,
                max: 3,
            },
        },
    },
    plugins: [
        admin(),
        anonymous(),
        nextCookies(), // Enable automatic cookie handling for Next.js server actions
    ],
});
