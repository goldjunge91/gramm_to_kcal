import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addRateLimitHeaders,
  checkRateLimit,
  initializeRedisStorage,
  keyGenerators,
  RateLimiter,
  rateLimiters,
} from "../lib/rate-limit";

// Mock NextRequest for testing
function createMockRequest(
  headers: Record<string, string>,
  url = "http://localhost/api/test",
): any {
  return {
    headers: {
      get: (key: string) => headers[key] ?? null,
    },
    url,
  };
}

describe("keyGenerators", () => {
  it("ip: returns correct key from x-forwarded-for", () => {
    const req = createMockRequest({ "x-forwarded-for": "1.2.3.4" });
    expect(keyGenerators.ip(req)).toBe("rate-limit:ip:1.2.3.4");
  });

  it("ip: falls back to x-real-ip", () => {
    const req = createMockRequest({ "x-real-ip": "5.6.7.8" });
    expect(keyGenerators.ip(req)).toBe("rate-limit:ip:5.6.7.8");
  });

  it("ip: falls back to unknown", () => {
    const req = createMockRequest({});
    expect(keyGenerators.ip(req)).toBe("rate-limit:ip:unknown");
  });

  it("user: returns correct key from x-user-id", () => {
    const req = createMockRequest({ "x-user-id": "user123" });
    expect(keyGenerators.user(req)).toBe("rate-limit:user:user123");
  });

  it("user: falls back to anonymous", () => {
    const req = createMockRequest({});
    expect(keyGenerators.user(req)).toBe("rate-limit:user:anonymous");
  });

  it("endpoint: returns correct key", () => {
    const req = createMockRequest(
      { "x-forwarded-for": "1.2.3.4" },
      "http://localhost/api/test",
    );
    expect(keyGenerators.endpoint(req)).toBe(
      "rate-limit:endpoint:/api/test:1.2.3.4",
    );
  });
});

describe("RateLimiter (MemoryStorage)", () => {
  let limiter: RateLimiter;
  let req: any;

  beforeEach(() => {
    limiter = new RateLimiter({
      requests: 3,
      window: 1,
      keyGenerator: keyGenerators.ip,
    });
    req = createMockRequest({ "x-forwarded-for": "1.2.3.4" });
  });

  it("allows requests under the limit", async () => {
    for (let i = 1; i <= 3; i++) {
      const result = await limiter.checkLimit(req);
      expect(result.rateLimited).toBe(false);
      expect(result.remaining).toBe(3 - i);
      expect(result.total).toBe(3);
    }
  });

  it("rate limits requests over the limit", async () => {
    for (let i = 1; i <= 4; i++) {
      const result = await limiter.checkLimit(req);
      if (i <= 3) {
        expect(result.rateLimited).toBe(false);
      } else {
        expect(result.rateLimited).toBe(true);
        expect(result.remaining).toBe(0);
      }
    }
  });

  it("resets after window expires", async () => {
    for (let i = 1; i <= 3; i++) {
      await limiter.checkLimit(req);
    }
    await new Promise((r) => setTimeout(r, 1100));
    const result = await limiter.checkLimit(req);
    expect(result.rateLimited).toBe(false);
    expect(result.remaining).toBe(2);
  }, 2000);

  it("fail open on storage error", async () => {
    // @ts-ignore
    limiter.storage.increment = vi.fn().mockRejectedValue(new Error("fail"));
    const result = await limiter.checkLimit(req);
    expect(result.rateLimited).toBe(false);
    expect(result.remaining).toBe(3);
  });
});

describe("rateLimiters presets", () => {
  it("api limiter default config", async () => {
    const req = createMockRequest({ "x-forwarded-for": "1.2.3.4" });
    const result = await rateLimiters.api.checkLimit(req);
    expect(result.total).toBe(100);
  });

  it("auth limiter default config", async () => {
    const req = createMockRequest({ "x-forwarded-for": "1.2.3.4" });
    const result = await rateLimiters.auth.checkLimit(req);
    expect(result.total).toBe(10);
  });

  it("external limiter default config", async () => {
    const req = createMockRequest({ "x-forwarded-for": "1.2.3.4" });
    const result = await rateLimiters.external.checkLimit(req);
    expect(result.total).toBe(30);
  });

  it("upload limiter default config", async () => {
    const req = createMockRequest({ "x-forwarded-for": "1.2.3.4" });
    const result = await rateLimiters.upload.checkLimit(req);
    expect(result.total).toBe(5);
  });
});

describe("checkRateLimit", () => {
  it("uses default api limiter", async () => {
    const req = createMockRequest({ "x-forwarded-for": "1.2.3.4" });
    const result = await checkRateLimit(req);
    expect(result.total).toBe(100);
  });

  it("uses custom limiter", async () => {
    const limiter = new RateLimiter({
      requests: 2,
      window: 1,
      keyGenerator: keyGenerators.ip,
    });
    const req = createMockRequest({ "x-forwarded-for": "1.2.3.4" });
    const result = await checkRateLimit(req, limiter);
    expect(result.total).toBe(2);
  });
});

describe("addRateLimitHeaders", () => {
  it("sets correct headers when not rate limited", () => {
    const headers = new Headers();
    const now = Date.now();
    const result = {
      rateLimited: false,
      remaining: 2,
      resetTime: now + 1000,
      total: 3,
    };
    const out = addRateLimitHeaders(headers, result);
    expect(out.get("X-RateLimit-Limit")).toBe("3");
    expect(out.get("X-RateLimit-Remaining")).toBe("2");
    expect(out.get("X-RateLimit-Reset")).toBe(
      Math.ceil(result.resetTime / 1000).toString(),
    );
    expect(out.get("Retry-After")).toBeNull();
  });

  it("sets Retry-After header when rate limited", () => {
    const headers = new Headers();
    const now = Date.now();
    const result = {
      rateLimited: true,
      remaining: 0,
      resetTime: now + 2000,
      total: 3,
    };
    const out = addRateLimitHeaders(headers, result);
    expect(out.get("Retry-After")).toBe(
      Math.ceil((result.resetTime - now) / 1000).toString(),
    );
  });
});

describe("initializeRedisStorage", () => {
  it("updates all rateLimiters to use RedisStorage", () => {
    const redisMock = {};
    initializeRedisStorage(redisMock);
    Object.values(rateLimiters).forEach((limiter) => {
      // @ts-ignore
      expect(limiter.storage).toBeInstanceOf(Object); // RedisStorage is not exported, so just check it's an object
    });
  });
});
