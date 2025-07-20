import { beforeEach, describe, expect, it, vi } from "vitest";

import { initializeRedis } from "../lib/redis";

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(({ url, token }) => ({
    url,
    token,
    ping: vi.fn(),
  })),
}));

vi.mock("./rate-limit", () => ({
  initializeRedisStorage: vi.fn(),
}));

const OLD_ENV = { ...process.env };

describe("initializeRedis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...OLD_ENV };
  });

  it("returns null and logs warning if env vars are missing", () => {
    process.env.UPSTASH_REDIS_REST_URL = "";
    process.env.UPSTASH_REDIS_REST_TOKEN = "";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = initializeRedis();
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "Redis not configured - using in-memory rate limiting",
    );
    warnSpy.mockRestore();
  });

  it("initializes Redis and returns instance if env vars are present", () => {
    process.env.UPSTASH_REDIS_REST_URL = "test-url";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = initializeRedis();
    expect(result).not.toBeNull();
    expect(typeof (result as any).get).toBe("function");
    expect(typeof (result as any).setex).toBe("function");
    expect(typeof (result as any).del).toBe("function");
    expect(logSpy).toHaveBeenCalledWith("Redis initialized for rate limiting");
    logSpy.mockRestore();
  });

  it("returns null and logs error if Redis constructor throws", () => {
    process.env.UPSTASH_REDIS_REST_URL = "fail";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fail";
    // vi.Mock ist kein Typ, stattdessen vi.fn() verwenden
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = initializeRedis();
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to initialize Redis:",
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });
});
