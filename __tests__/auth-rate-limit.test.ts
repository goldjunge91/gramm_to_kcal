import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AuthSecurityMonitor,
  checkDbRateLimit,
  checkEmailVerifyRateLimit,
  checkPasswordResetRateLimit,
  checkSignInRateLimit,
  checkSignUpRateLimit,
  createDbRateLimitedSupabaseClient,
  createRateLimitedSupabaseClient,
  getAuthRateLimitHealth,
  SupabaseAuthRateLimiter,
} from "../lib/utils/auth-rate-limit";

// Removed local mockRedis definition and vi.mock
// Use global.mockRedis instead

const identifier = "test@example.com";
const now = Date.now();
const mockRedis = global.mockRedis;

describe("SupabaseAuthRateLimiter", () => {
  let limiter: SupabaseAuthRateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
    limiter = new SupabaseAuthRateLimiter();
  });

  it("should allow if redis is not configured", async () => {
    // Simulate no redis
    limiter.setRedis(undefined);
    const result = await limiter.checkRateLimit("SIGN_IN", identifier);
    expect(result.allowed).toBe(true);
    expect(result.blocked).toBe(false);
  });

  it("should block if block key is set and not expired", async () => {
    mockRedis.get.mockResolvedValueOnce((now + 10000).toString());
    const result = await limiter.checkRateLimit("SIGN_IN", identifier);
    expect(result.allowed).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.blockExpiry).toBeGreaterThan(now);
  });

  it("should remove block if expired", async () => {
    mockRedis.get.mockResolvedValueOnce((now - 10000).toString());
    mockRedis.del.mockResolvedValueOnce(1);
    mockRedis.pipeline.mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 1],
        [null, 1],
      ]),
    });
    const result = await limiter.checkRateLimit("SIGN_IN", identifier);
    expect(result.allowed).toBe(true);
    expect(result.blocked).toBe(false);
  });

  it("should block after exceeding rate limit", async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockRedis.pipeline.mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 6],
        [null, 1],
      ]), // 6 > 5
    });
    mockRedis.setex.mockResolvedValueOnce("OK");
    const result = await limiter.checkRateLimit("SIGN_IN", identifier);
    expect(result.allowed).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.blockExpiry).toBeGreaterThan(now);
  });

  it("should reset rate limit and block", async () => {
    mockRedis.del.mockResolvedValueOnce(1);
    mockRedis.del.mockResolvedValueOnce(1);
    await expect(
      limiter.resetRateLimit("SIGN_IN", identifier),
    ).resolves.toBeUndefined();
    expect(mockRedis.del).toHaveBeenCalledTimes(2);
  });

  it("should get status", async () => {
    mockRedis.get.mockResolvedValueOnce("2");
    mockRedis.get.mockResolvedValueOnce("");
    const status = await limiter.getStatus("SIGN_IN", identifier);
    expect(status?.currentCount).toBe(2);
    expect(status?.blocked).toBe(false);
    expect(status?.remaining).toBeGreaterThanOrEqual(0);
  });
});

describe("Helper functions", () => {
  it("checkSignInRateLimit delegates to limiter", async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockRedis.pipeline.mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 1],
        [null, 1],
      ]),
    });
    const result = await checkSignInRateLimit(identifier);
    expect(result.allowed).toBe(true);
  });

  it("checkSignUpRateLimit delegates to limiter", async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockRedis.pipeline.mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 1],
        [null, 1],
      ]),
    });
    const result = await checkSignUpRateLimit(identifier);
    expect(result.allowed).toBe(true);
  });

  it("checkPasswordResetRateLimit delegates to limiter", async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockRedis.pipeline.mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 1],
        [null, 1],
      ]),
    });
    const result = await checkPasswordResetRateLimit(identifier);
    expect(result.allowed).toBe(true);
  });

  it("checkEmailVerifyRateLimit delegates to limiter", async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockRedis.pipeline.mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 1],
        [null, 1],
      ]),
    });
    const result = await checkEmailVerifyRateLimit(identifier);
    expect(result.allowed).toBe(true);
  });
});

describe("createRateLimitedSupabaseClient", () => {
  const mockSupabase = {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue("signed-in"),
      signUp: vi.fn().mockResolvedValue("signed-up"),
      resetPasswordForEmail: vi.fn().mockResolvedValue("reset"),
      resend: vi.fn().mockResolvedValue("resent"),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.pipeline.mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 1],
        [null, 1],
      ]),
    });
  });

  it("signInWithPassword allows if not rate limited", async () => {
    const client = createRateLimitedSupabaseClient(mockSupabase as any);
    const result = await client.auth.signInWithPassword({
      email: identifier,
      password: "pw",
    });
    expect(result).toBe("signed-in");
  });

  it("signInWithPassword throws if rate limited", async () => {
    mockRedis.get.mockResolvedValueOnce((now + 10000).toString());
    const client = createRateLimitedSupabaseClient(mockSupabase as any);
    await expect(
      client.auth.signInWithPassword({
        email: identifier,
        password: "pw",
      }),
    ).rejects.toThrow(/Too many sign-in attempts/);
  });

  it("signUp allows if not rate limited", async () => {
    const client = createRateLimitedSupabaseClient(mockSupabase as any);
    const result = await client.auth.signUp({
      email: identifier,
      password: "pw",
    });
    expect(result).toBe("signed-up");
  });

  it("resetPasswordForEmail allows if not rate limited", async () => {
    const client = createRateLimitedSupabaseClient(mockSupabase as any);
    const result = await client.auth.resetPasswordForEmail(identifier);
    expect(result).toBe("reset");
  });

  it("resend allows if not rate limited", async () => {
    const client = createRateLimitedSupabaseClient(mockSupabase as any);
    const result = await client.auth.resend({
      type: "signup",
      email: identifier,
    });
    expect(result).toBe("resent");
  });
});

describe("AuthSecurityMonitor", () => {
  let monitor: AuthSecurityMonitor;

  beforeEach(() => {
    monitor = new AuthSecurityMonitor();
    vi.clearAllMocks();
  });

  it("logAuthAttempt stores log", async () => {
    mockRedis.lpush.mockResolvedValueOnce(1);
    mockRedis.ltrim.mockResolvedValueOnce(1);
    mockRedis.expire.mockResolvedValueOnce(1);
    await monitor.logAuthAttempt("SIGN_IN", identifier, false, {
      ip: "1.2.3.4",
      userAgent: "ua",
    });
    expect(mockRedis.lpush).toHaveBeenCalled();
    expect(mockRedis.ltrim).toHaveBeenCalled();
    expect(mockRedis.expire).toHaveBeenCalled();
  });

  it("detectSuspiciousActivity returns not suspicious if no logs", async () => {
    mockRedis.lrange.mockResolvedValueOnce([]);
    const result = await monitor.detectSuspiciousActivity(identifier);
    expect(result.suspicious).toBe(false);
    expect(result.riskScore).toBe(0);
  });

  it("detectSuspiciousActivity returns suspicious for multiple failed attempts", async () => {
    const logs = [
      {
        success: false,
        timestamp: now - 1000,
        ip: "1.1.1.1",
        userAgent: "ua1",
      },
      {
        success: false,
        timestamp: now - 2000,
        ip: "1.1.1.2",
        userAgent: "ua2",
      },
      {
        success: false,
        timestamp: now - 3000,
        ip: "1.1.1.3",
        userAgent: "ua3",
      },
      {
        success: true,
        timestamp: now - 4000,
        ip: "1.1.1.1",
        userAgent: "ua1",
      },
      {
        success: false,
        timestamp: now - 5000,
        ip: "1.1.1.2",
        userAgent: "ua2",
      },
    ].map((l) => JSON.stringify(l));
    mockRedis.lrange.mockResolvedValueOnce(logs);
    const result = await monitor.detectSuspiciousActivity(identifier);
    expect(result.suspicious).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(40);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

describe("getAuthRateLimitHealth", () => {
  it("returns health info", async () => {
    const result = await getAuthRateLimitHealth();
    expect(result).toHaveProperty("enabled");
    expect(result).toHaveProperty("limits");
    expect(result).toHaveProperty("features");
    expect(result).toHaveProperty("timestamp");
  });
});

describe("checkDbRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows if under limit", async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockRedis.pipeline.mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 1],
        [null, 1],
      ]),
    });
    const result = await checkDbRateLimit(identifier);
    expect(result.allowed).toBe(true);
    expect(result.blocked).toBe(false);
  });

  it("blocks if over limit", async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockRedis.pipeline.mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 101],
        [null, 1],
      ]),
    });
    mockRedis.setex.mockResolvedValueOnce("OK");
    const result = await checkDbRateLimit(identifier);
    expect(result.allowed).toBe(false);
    expect(result.blocked).toBe(true);
  });

  it("blocks if block key is set", async () => {
    mockRedis.get.mockResolvedValueOnce((now + 10000).toString());
    const result = await checkDbRateLimit(identifier);
    expect(result.allowed).toBe(false);
    expect(result.blocked).toBe(true);
  });
});

describe("createDbRateLimitedSupabaseClient", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue("selected"),
      insert: vi.fn().mockResolvedValue("inserted"),
      update: vi.fn().mockResolvedValue("updated"),
      delete: vi.fn().mockResolvedValue("deleted"),
    }),
    auth: {},
    realtime: {},
    storage: {},
    rpc: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
    getChannels: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.pipeline.mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 1],
        [null, 1],
      ]),
    });
  });

  it("allows select if not rate limited", async () => {
    const client = createDbRateLimitedSupabaseClient(
      mockSupabase as any,
      identifier,
    );
    const result = await client.from("table").select();
    expect(result).toBe("selected");
  });

  it("throws on select if rate limited", async () => {
    mockRedis.get.mockResolvedValueOnce((now + 10000).toString());
    const client = createDbRateLimitedSupabaseClient(
      mockSupabase as any,
      identifier,
    );
    await expect(client.from("table").select()).rejects.toThrow(
      /DB Rate limit exceeded/,
    );
  });

  it("allows insert if not rate limited", async () => {
    const client = createDbRateLimitedSupabaseClient(
      mockSupabase as any,
      identifier,
    );
    const result = await client.from("table").insert({});
    expect(result).toBe("inserted");
  });

  it("allows update if not rate limited", async () => {
    const client = createDbRateLimitedSupabaseClient(
      mockSupabase as any,
      identifier,
    );
    const result = await client.from("table").update({});
    expect(result).toBe("updated");
  });

  it("allows delete if not rate limited", async () => {
    const client = createDbRateLimitedSupabaseClient(
      mockSupabase as any,
      identifier,
    );
    const result = await client.from("table").delete();
    expect(result).toBe("deleted");
  });
});
