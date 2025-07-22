import type { RateLimitConfig } from '../lib/rate-limit'
import { NextResponse } from 'next/server'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  emergencyRateLimit,
  RATE_LIMIT_CONFIGS,
  rateLimiters,
  rateLimitMiddleware,
} from '../lib/middleware/rate-limit-middleware'
import { RateLimiter } from '../lib/rate-limit'

// Mocks
class MockRequest {
  url: string
  headers: Map<string, string>
  constructor(url: string, headers: Record<string, string> = {}) {
    this.url = url
    this.headers = new Map(Object.entries(headers))
  }

  getHeader(key: string) {
    return this.headers.get(key) ?? null
  }
}

function mockRateLimiter(
  rateLimited: boolean,
  resetTime = Date.now() + 1000,
): RateLimiter {
  const config: RateLimitConfig = {
    requests: 1,
    window: 1,
  }
  const storage = {
    get: () => Promise.resolve(0),
    set: () => Promise.resolve(),
    increment: () => Promise.resolve(1),
  }
  const limiter = new RateLimiter(config, storage);
  (limiter as any).checkLimit = vi.fn().mockResolvedValue({
    rateLimited,
    resetTime,
    remaining: rateLimited ? 0 : 1,
    total: 1,
  })
  return limiter
}

describe('rateLimitMiddleware', () => {
  beforeEach(() => {
    // Reset all rateLimiters to mock objects before each test
    for (const [key] of rateLimiters) {
      rateLimiters.set(key, mockRateLimiter(false))
    }
  })

  it('should skip rate limiting for static assets', async () => {
    const req = new MockRequest('https://test/_next/static/file.js')
    const res = await rateLimitMiddleware(req as any)
    expect(res).toBeNull()
  })

  it('should skip rate limiting for favicon', async () => {
    const req = new MockRequest('https://test/favicon.ico')
    const res = await rateLimitMiddleware(req as any)
    expect(res).toBeNull()
  })

  it('should skip rate limiting for image assets', async () => {
    const req = new MockRequest('https://test/image.png')
    const res = await rateLimitMiddleware(req as any)
    expect(res).toBeNull()
  })

  it('should apply API rate limiting for /api/ route', async () => {
    const req = new MockRequest('https://test/api/test')
    const res = await rateLimitMiddleware(req as any)
    expect(res).toBeInstanceOf(NextResponse)
    expect(res?.status).toBe(200) // Should not be rate limited
  })

  it('should apply auth rate limiting for /api/auth/ route', async () => {
    const req = new MockRequest('https://test/api/auth/login')
    const res = await rateLimitMiddleware(req as any)
    expect(res).toBeInstanceOf(NextResponse)
    expect(res?.status).toBe(200)
  })

  it('should apply external rate limiting for /api/products/ route', async () => {
    const req = new MockRequest('https://test/api/products/123')
    const res = await rateLimitMiddleware(req as any)
    expect(res).toBeInstanceOf(NextResponse)
    expect(res?.status).toBe(200)
  })

  it('should return 400 for requests exceeding content-length limit', async () => {
    const req = new MockRequest('https://test/api/test', {
      'content-length': String(11 * 1024 * 1024),
    })
    const res = await rateLimitMiddleware(req as any)
    expect(res).toBeInstanceOf(NextResponse)
    expect(res?.status).toBe(400)
    expect(await res?.text()).toContain('Request validation failed')
  })

  it('should log suspicious user agents but still allow request', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const req = new MockRequest('https://test/api/test', {
      'user-agent': 'evil-bot',
    })
    const res = await rateLimitMiddleware(req as any)
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Suspicious user agent'),
    )
    expect(res).toBeInstanceOf(NextResponse)
    spy.mockRestore()
  })

  it('should return 429 if rate limit exceeded', async () => {
    // Mock rate limiter to always rate limit
    for (const [key] of rateLimiters) {
      rateLimiters.set(key, mockRateLimiter(true))
    }
    const req = new MockRequest('https://test/api/test')
    const res = await rateLimitMiddleware(req as any)
    expect(res).toBeInstanceOf(NextResponse)
    expect(res?.status).toBe(429)
    const body = await res?.json()
    expect(body.error).toBe('Rate limit exceeded')
  })

  it('should fail open if rate limiter throws', async () => {
    for (const [key] of rateLimiters) {
      const config: RateLimitConfig = { requests: 1, window: 1 }
      const storage = {
        get: () => Promise.resolve(0),
        set: () => Promise.resolve(),
        increment: () => Promise.resolve(1),
      }
      const limiter = new RateLimiter(config, storage);
      (limiter as any).checkLimit = vi
        .fn()
        .mockRejectedValue(new Error('fail'))
      rateLimiters.set(key, limiter)
    }
    const req = new MockRequest('https://test/api/test')
    const res = await rateLimitMiddleware(req as any)
    expect(res).toBeInstanceOf(NextResponse)
    expect(res?.headers.get('X-RateLimit-Error')).toBe(
      'Rate limiting temporarily unavailable',
    )
  })
})

describe('emergencyRateLimit', () => {
  it('should return false if not rate limited', async () => {
    // Mock EMERGENCY_RATE_LIMITER
    const orig = (globalThis as any).EMERGENCY_RATE_LIMITER;
    (globalThis as any).EMERGENCY_RATE_LIMITER = mockRateLimiter(false)
    const req = new MockRequest('https://test/api/test')
    const result = await emergencyRateLimit(req as any)
    expect(result).toBe(false);
    (globalThis as any).EMERGENCY_RATE_LIMITER = orig
  })

  it('should return true if rate limited', async () => {
    const orig = (globalThis as any).EMERGENCY_RATE_LIMITER;
    (globalThis as any).EMERGENCY_RATE_LIMITER = mockRateLimiter(true)
    const req = new MockRequest('https://test/api/test')
    const result = await emergencyRateLimit(req as any)
    expect(result).toBe(true);
    (globalThis as any).EMERGENCY_RATE_LIMITER = orig
  })

  it('should fail open if rate limiter throws', async () => {
    const orig = (globalThis as any).EMERGENCY_RATE_LIMITER;
    (globalThis as any).EMERGENCY_RATE_LIMITER = {
      checkLimit: vi.fn().mockRejectedValue(new Error('fail')),
    }
    const req = new MockRequest('https://test/api/test')
    const result = await emergencyRateLimit(req as any)
    expect(result).toBe(false);
    (globalThis as any).EMERGENCY_RATE_LIMITER = orig
  })
})

describe('rATE_LIMIT_CONFIGS', () => {
  it('should have correct config keys', () => {
    expect(RATE_LIMIT_CONFIGS).toHaveProperty('api')
    expect(RATE_LIMIT_CONFIGS).toHaveProperty('auth')
    expect(RATE_LIMIT_CONFIGS).toHaveProperty('external')
    expect(RATE_LIMIT_CONFIGS).toHaveProperty('upload')
  })
})
