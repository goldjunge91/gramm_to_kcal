/**
 * Enhanced Supabase Auth Rate Limiting
 * Protects authentication endpoints with Redis-based rate limiting
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { getRedis } from "@/lib/redis";

// Rate limiting configurations for different auth operations
const AUTH_RATE_LIMITS = {
  // Sign in attempts (stricter)
  SIGN_IN: {
    requests: 5,
    window: 300, // 5 attempts per 5 minutes
    blockDuration: 900, // 15 minute block after exceeding
  },

  DB_RATE_LIMIT: {
    requests: 100, // z.B. 100 Requests
    window: 60, // pro 60 Sekunden
    blockDuration: 900, // 15 minute block after exceeding
  },

  // Sign up attempts
  SIGN_UP: {
    requests: 3,
    window: 3600, // 3 attempts per hour
    blockDuration: 3600, // 1 hour block
  },

  // Password reset requests
  PASSWORD_RESET: {
    requests: 3,
    window: 3600, // 3 attempts per hour
    blockDuration: 1800, // 30 minute block
  },

  // Email verification resend
  EMAIL_VERIFY: {
    requests: 3,
    window: 1800, // 3 attempts per 30 minutes
    blockDuration: 1800, // 30 minute block
  },

  // General auth operations
  GENERAL: {
    requests: 20,
    window: 300, // 20 attempts per 5 minutes
    blockDuration: 300, // 5 minute block
  },
} as const;

type AuthOperation = keyof typeof AUTH_RATE_LIMITS;

interface AuthRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked: boolean;
  blockExpiry?: number;
}

// Enhanced rate limiter for auth operations
export class SupabaseAuthRateLimiter {
  private redis = getRedis();

  /**
   * Für Tests: Setzt die Redis-Instanz manuell.
   */
  public setRedis(redis: any) {
    this.redis = redis;
  }

  private getKey(operation: AuthOperation, identifier: string): string {
    return `auth:rate-limit:${operation}:${identifier}`;
  }

  private getBlockKey(operation: AuthOperation, identifier: string): string {
    return `auth:block:${operation}:${identifier}`;
  }

  async checkRateLimit(
    operation: AuthOperation,
    identifier: string, // IP address or email
  ): Promise<AuthRateLimitResult> {
    if (!this.redis) {
      // No Redis - allow but log warning
      console.warn("Auth rate limiting unavailable - Redis not configured");
      return {
        allowed: true,
        remaining: AUTH_RATE_LIMITS[operation].requests,
        resetTime: Date.now() + AUTH_RATE_LIMITS[operation].window * 1000,
        blocked: false,
      };
    }

    const config = AUTH_RATE_LIMITS[operation];
    const key = this.getKey(operation, identifier);
    const blockKey = this.getBlockKey(operation, identifier);

    try {
      // Check if currently blocked
      const blockExpiry = await this.redis.get(blockKey);
      if (typeof blockExpiry === "string" && blockExpiry.length > 0) {
        const expiryTime = Number.parseInt(blockExpiry, 10);
        if (Date.now() < expiryTime) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: expiryTime,
            blocked: true,
            blockExpiry: expiryTime,
          };
        }
        // Block expired, remove it
        await this.redis.del(blockKey);
      }

      // Check current rate limit
      const pipeline = this.redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, config.window);
      const results = (await pipeline.exec()) as [any, any][];

      let currentCount = 0;
      if (
        Array.isArray(results) &&
        results[0] &&
        typeof results[0][1] === "number"
      ) {
        currentCount = results[0][1];
      }
      const remaining = Math.max(0, config.requests - currentCount);
      const resetTime = Date.now() + config.window * 1000;

      // If exceeded, create block
      if (currentCount > config.requests) {
        const blockExpiryTime = Date.now() + config.blockDuration * 1000;
        await this.redis.setex(
          blockKey,
          config.blockDuration,
          blockExpiryTime.toString(),
        );

        return {
          allowed: false,
          remaining: 0,
          resetTime: blockExpiryTime,
          blocked: true,
          blockExpiry: blockExpiryTime,
        };
      }

      return {
        allowed: true,
        remaining,
        resetTime,
        blocked: false,
      };
    } catch (error) {
      console.error("Auth rate limit check failed:", error);
      // Fail open for auth operations
      return {
        allowed: true,
        remaining: config.requests,
        resetTime: Date.now() + config.window * 1000,
        blocked: false,
      };
    }
  }

  async resetRateLimit(
    operation: AuthOperation,
    identifier: string,
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const key = this.getKey(operation, identifier);
      const blockKey = this.getBlockKey(operation, identifier);

      await Promise.all([this.redis.del(key), this.redis.del(blockKey)]);
    } catch (error) {
      console.error("Failed to reset auth rate limit:", error);
    }
  }

  async getStatus(operation: AuthOperation, identifier: string) {
    if (!this.redis) return null;

    try {
      const key = this.getKey(operation, identifier);
      const blockKey = this.getBlockKey(operation, identifier);

      const [count, blockExpiry] = await Promise.all([
        this.redis.get(key),
        this.redis.get(blockKey),
      ]);

      const config = AUTH_RATE_LIMITS[operation];
      let currentCount = 0;
      if (typeof count === "string" && count.length > 0) {
        currentCount = Number.parseInt(count, 10);
      }
      let isBlocked = false;
      if (typeof blockExpiry === "string" && blockExpiry.length > 0) {
        isBlocked = Date.now() < Number.parseInt(blockExpiry, 10);
      }

      let blockExpiryValue: number | null = null;
      if (
        isBlocked &&
        typeof blockExpiry === "string" &&
        blockExpiry.length > 0
      ) {
        blockExpiryValue = Number.parseInt(blockExpiry, 10);
      }
      return {
        operation,
        identifier,
        currentCount,
        limit: config.requests,
        remaining: Math.max(0, config.requests - currentCount),
        blocked: !!isBlocked,
        blockExpiry: blockExpiryValue,
        window: config.window,
        blockDuration: config.blockDuration,
      };
    } catch (error) {
      console.error("Failed to get auth rate limit status:", error);
      return null;
    }
  }
}

// Global instance
export const authRateLimiter = new SupabaseAuthRateLimiter();

// Helper functions for different auth operations
export async function checkSignInRateLimit(
  identifier: string,
): Promise<AuthRateLimitResult> {
  return await authRateLimiter.checkRateLimit("SIGN_IN", identifier);
}

export async function checkSignUpRateLimit(
  identifier: string,
): Promise<AuthRateLimitResult> {
  return await authRateLimiter.checkRateLimit("SIGN_UP", identifier);
}

export async function checkPasswordResetRateLimit(
  identifier: string,
): Promise<AuthRateLimitResult> {
  return await authRateLimiter.checkRateLimit("PASSWORD_RESET", identifier);
}

export async function checkEmailVerifyRateLimit(
  identifier: string,
): Promise<AuthRateLimitResult> {
  return await authRateLimiter.checkRateLimit("EMAIL_VERIFY", identifier);
}

// Enhanced Supabase client wrapper with rate limiting
export function createRateLimitedSupabaseClient(supabase: SupabaseClient) {
  const originalAuth = supabase.auth;

  const rateLimitedAuth = {
    ...originalAuth, // Übernimmt alle ursprünglichen Auth-Methoden

    async signInWithPassword(credentials: { email: string; password: string }) {
      const rateLimit = await checkSignInRateLimit(credentials.email);
      if (!rateLimit.allowed) {
        throw new Error(
          `Too many sign-in attempts. ${
            rateLimit.blocked
              ? "Account temporarily blocked."
              : "Please try again later."
          }`,
        );
      }
      return originalAuth.signInWithPassword(credentials);
    },

    async signUp(credentials: {
      email: string;
      password: string;
      options?: any;
    }) {
      const rateLimit = await checkSignUpRateLimit(credentials.email);
      if (!rateLimit.allowed) {
        throw new Error(
          `Too many sign-up attempts. ${
            rateLimit.blocked
              ? "Account temporarily blocked."
              : "Please try again later."
          }`,
        );
      }
      return originalAuth.signUp(credentials);
    },

    async resetPasswordForEmail(email: string, options?: any) {
      const rateLimit = await checkPasswordResetRateLimit(email);
      if (!rateLimit.allowed) {
        throw new Error(
          `Too many password reset attempts. ${
            rateLimit.blocked
              ? "Account temporarily blocked."
              : "Please try again later."
          }`,
        );
      }
      return originalAuth.resetPasswordForEmail(email, options);
    },

    async resend(credentials: {
      type: "signup" | "email_change";
      email: string;
      options?: any;
    }) {
      const rateLimit = await checkEmailVerifyRateLimit(credentials.email);
      if (!rateLimit.allowed) {
        throw new Error(
          `Too many verification attempts. ${
            rateLimit.blocked
              ? "Account temporarily blocked."
              : "Please try again later."
          }`,
        );
      }
      return originalAuth.resend(credentials);
    },

    async updateUser(attributes: {
      password?: string;
      email?: string;
      data?: object;
    }) {
      const rateLimit = await authRateLimiter.checkRateLimit(
        "GENERAL",
        "user-update",
      );
      if (!rateLimit.allowed) {
        throw new Error(
          `Too many update attempts. ${
            rateLimit.blocked
              ? "Account temporarily blocked."
              : "Please try again later."
          }`,
        );
      }
      return originalAuth.updateUser(attributes);
    },

    async signOut() {
      // Optionally, add rate limiting here if needed
      return await originalAuth.signOut();
    },

    async getUser() {
      return await originalAuth.getUser();
    },

    async getSession() {
      return await originalAuth.getSession();
    },
  };

  return {
    ...supabase,
    auth: rateLimitedAuth,
    from: (table: string) => supabase.from(table),
    // from: (...args) => supabase.from(...args),
  };
}

// Suspicious activity detection
export class AuthSecurityMonitor {
  private redis = getRedis();

  async logAuthAttempt(
    operation: AuthOperation,
    identifier: string,
    success: boolean,
    metadata: {
      ip?: string;
      userAgent?: string;
      timestamp?: number;
    } = {},
  ) {
    if (!this.redis) return;

    try {
      const logKey = `auth:log:${operation}:${identifier}`;
      const logEntry = {
        success,
        timestamp: metadata.timestamp || Date.now(),
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      };

      // Store last 10 attempts
      await this.redis.lpush(logKey, JSON.stringify(logEntry));
      await this.redis.ltrim(logKey, 0, 9);
      await this.redis.expire(logKey, 86400); // 24 hours
    } catch (error) {
      console.error("Failed to log auth attempt:", error);
    }
  }

  async detectSuspiciousActivity(identifier: string): Promise<{
    suspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    if (!this.redis) {
      return { suspicious: false, reasons: [], riskScore: 0 };
    }

    try {
      const logKey = `auth:log:SIGN_IN:${identifier}`;
      const logs = await this.redis.lrange(logKey, 0, -1);

      if (!logs || logs.length === 0) {
        return { suspicious: false, reasons: [], riskScore: 0 };
      }

      const attempts = logs.map((log) => JSON.parse(log));
      const recentAttempts = attempts.filter(
        (attempt) => Date.now() - attempt.timestamp < 3600000, // Last hour
      );

      const reasons: string[] = [];
      let riskScore = 0;

      // Multiple failed attempts
      const failedAttempts = recentAttempts.filter((a) => !a.success);
      if (failedAttempts.length >= 3) {
        reasons.push("Multiple failed login attempts");
        riskScore += 30;
      }

      // Rapid succession attempts
      if (recentAttempts.length >= 5) {
        reasons.push("High frequency login attempts");
        riskScore += 20;
      }

      // Multiple IP addresses
      const uniqueIPs = new Set(
        recentAttempts.map((a) => a.ip).filter(Boolean),
      );
      if (uniqueIPs.size >= 3) {
        reasons.push("Multiple IP addresses");
        riskScore += 25;
      }

      // Multiple user agents
      const uniqueUAs = new Set(
        recentAttempts.map((a) => a.userAgent).filter(Boolean),
      );
      if (uniqueUAs.size >= 3) {
        reasons.push("Multiple user agents");
        riskScore += 15;
      }

      return {
        suspicious: riskScore >= 40,
        reasons,
        riskScore,
      };
    } catch (error) {
      console.error("Failed to detect suspicious activity:", error);
      return { suspicious: false, reasons: [], riskScore: 0 };
    }
  }
}

export const authSecurityMonitor = new AuthSecurityMonitor();

// Health check for auth rate limiting
export async function getAuthRateLimitHealth() {
  const redis = await getRedis();

  return {
    enabled: !!redis,
    limits: Object.entries(AUTH_RATE_LIMITS).map(([operation, config]) => ({
      operation,
      requests: config.requests,
      window: `${config.window}s`,
      blockDuration: `${config.blockDuration}s`,
    })),
    features: {
      rateLimiting: !!redis,
      blocking: !!redis,
      activityLogging: !!redis,
      suspiciousActivityDetection: !!redis,
    },
    timestamp: new Date().toISOString(),
  };
}

// DB Rate Limiting
export async function checkDbRateLimit(
  identifier: string,
): Promise<AuthRateLimitResult> {
  const redis = getRedis();
  const config = AUTH_RATE_LIMITS.DB_RATE_LIMIT;
  const key = `db:rate-limit:${identifier}`;
  const blockKey = `db:block:${identifier}`;

  if (!redis) {
    console.warn("DB rate limiting unavailable - Redis not configured");
    return {
      allowed: true,
      remaining: config.requests,
      resetTime: Date.now() + config.window * 1000,
      blocked: false,
    };
  }

  // Check block
  const blockExpiry = await redis.get(blockKey);
  if (typeof blockExpiry === "string" && blockExpiry.length > 0) {
    const expiryTime = Number.parseInt(blockExpiry, 10);
    if (Date.now() < expiryTime) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: expiryTime,
        blocked: true,
        blockExpiry: expiryTime,
      };
    }
    await redis.del(blockKey);
  }

  // Check current rate limit
  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, config.window);
  const results = (await pipeline.exec()) as [any, any][];
  let currentCount = 0;
  if (
    Array.isArray(results) &&
    results[0] &&
    typeof results[0][1] === "number"
  ) {
    currentCount = results[0][1];
  }
  const remaining = Math.max(0, config.requests - currentCount);
  const resetTime = Date.now() + config.window * 1000;

  // If exceeded, create block
  if (currentCount > config.requests) {
    const blockExpiryTime = Date.now() + config.blockDuration * 1000;
    await redis.setex(
      blockKey,
      config.blockDuration,
      blockExpiryTime.toString(),
    );
    return {
      allowed: false,
      remaining: 0,
      resetTime: blockExpiryTime,
      blocked: true,
      blockExpiry: blockExpiryTime,
    };
  }

  return {
    allowed: true,
    remaining,
    resetTime,
    blocked: false,
  };
}

// Wrapper für Supabase-Client mit DB-Rate-Limit
export function createDbRateLimitedSupabaseClient(
  supabase: SupabaseClient,
  identifier: string,
) {
  // Alle Properties des originalen Supabase-Clients durchreichen
  const wrapper: any = { ...supabase };
  wrapper.from = function (table: string) {
    const base = supabase.from(table);
    return {
      async select(...args: [string?, ...any[]]) {
        const rateLimit = await checkDbRateLimit(identifier);
        if (!rateLimit.allowed) {
          throw new Error("DB Rate limit exceeded. Please try again später.");
        }
        return base.select(...args);
      },
      async insert(values: any, ...rest: any[]) {
        const rateLimit = await checkDbRateLimit(identifier);
        if (!rateLimit.allowed) {
          throw new Error("DB Rate limit exceeded. Please try again später.");
        }
        return base.insert(values, ...rest);
      },
      async update(values: any, ...rest: any[]) {
        const rateLimit = await checkDbRateLimit(identifier);
        if (!rateLimit.allowed) {
          throw new Error("DB Rate limit exceeded. Please try again später.");
        }
        return base.update(values, ...rest);
      },
      async delete(...args: any[]) {
        const rateLimit = await checkDbRateLimit(identifier);
        if (!rateLimit.allowed) {
          throw new Error("DB Rate limit exceeded. Please try again später.");
        }
        return base.delete(...args);
      },
      // ...weitere Methoden nach Bedarf
    };
  };
  // Auth bleibt original!
  wrapper.auth = supabase.auth;
  // Weitere Properties wie .realtime, .storage, .rpc etc. durchreichen
  wrapper.realtime = supabase.realtime;
  wrapper.storage = supabase.storage;
  wrapper.rpc = supabase.rpc?.bind(supabase);
  wrapper.channel = supabase.channel?.bind(supabase);
  wrapper.removeChannel = supabase.removeChannel?.bind(supabase);
  wrapper.getChannels = supabase.getChannels?.bind(supabase);
  // Die Properties supabaseUrl, supabaseKey, realtimeUrl, authUrl sind protected und können nicht durchgereicht werden.
  // ... ggf. weitere Properties
  return wrapper;
}
