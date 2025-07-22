import type { NextRequest } from 'next/server'

// Rate limiting configuration
export interface RateLimitConfig {
  requests: number
  window: number // in seconds
  keyGenerator?: (request: NextRequest) => string
}

// Rate limiting result
export interface RateLimitResult {
  rateLimited: boolean
  remaining: number
  resetTime: number
  total: number
}

// Storage interface for different backends
interface RateLimitStorage {
  get: (key: string) => Promise<number | null>
  set: (key: string, value: number, ttl: number) => Promise<void>
  increment: (key: string, ttl: number) => Promise<number>
}

// In-memory storage (for development/fallback)
class MemoryStorage implements RateLimitStorage {
  private store = new Map<string, { value: number, expiry: number }>()
  private readonly maxUsageMemory: number

  constructor(maxUsageMemory: number = 1000) {
    this.maxUsageMemory = maxUsageMemory
  }

  get(key: string): Promise<number | null> {
    const item = this.store.get(key)
    if (!item || Date.now() > item.expiry) {
      this.store.delete(key)
      return Promise.resolve(null)
    }
    return Promise.resolve(item.value)
  }

  set(key: string, value: number, ttl: number): Promise<void> {
    if (this.store.size >= this.maxUsageMemory) {
      const keys = Array.from(this.store.keys())
      for (
        let i = 0;
        i < Math.ceil(this.store.size - this.maxUsageMemory + 1);
        i++
      ) {
        this.store.delete(keys[i])
      }
    }
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    })
    return Promise.resolve()
  }

  async increment(key: string, ttl: number): Promise<number> {
    const current = await this.get(key)
    const newValue = (current || 0) + 1
    await this.set(key, newValue, ttl)
    return newValue
  }
}

// Redis storage (for production with Upstash)
class RedisStorage implements RateLimitStorage {
  private redis: any

  constructor(redis: any) {
    this.redis = redis
  }

  async get(key: string): Promise<number | null> {
    const value = await this.redis.get(key)
    return value ? Number.parseInt(value, 10) : null
  }

  async set(key: string, value: number, ttl: number): Promise<void> {
    await this.redis.setex(key, ttl, value)
  }

  async increment(key: string, ttl: number): Promise<number> {
    const pipeline = this.redis.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, ttl)
    const results = await pipeline.exec()
    return results[0][1]
  }
}

// Default key generators
export const keyGenerators = {
  ip: (request: NextRequest) => {
    const ip
      = request.headers.get('x-forwarded-for')?.split(',')[0]
        || request.headers.get('x-real-ip')
        || 'unknown'
    return `rate-limit:ip:${ip}`
  },

  user: (request: NextRequest) => {
    // Extract user ID from auth (implement based on your auth system)
    const userId = request.headers.get('x-user-id') || 'anonymous'
    return `rate-limit:user:${userId}`
  },

  endpoint: (request: NextRequest) => {
    const pathname = new URL(request.url).pathname
    const ip
      = request.headers.get('x-forwarded-for')?.split(',')[0]
        || request.headers.get('x-real-ip')
        || 'unknown'
    return `rate-limit:endpoint:${pathname}:${ip}`
  },
}

// Rate limiter class
export class RateLimiter {
  private storage: RateLimitStorage
  private config: RateLimitConfig

  constructor(config: RateLimitConfig, storage?: RateLimitStorage) {
    this.config = config
    // Default: max 1000 Einträge im Memory
    this.storage = storage || new MemoryStorage(1000)
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const keyGenerator = this.config.keyGenerator || keyGenerators.ip
    const key = keyGenerator(request)

    try {
      const currentCount = await this.storage.increment(
        key,
        this.config.window,
      )
      const remaining = Math.max(0, this.config.requests - currentCount)
      const resetTime = Date.now() + this.config.window * 1000

      return {
        rateLimited: currentCount > this.config.requests,
        remaining,
        resetTime,
        total: this.config.requests,
      }
    }
    catch (error) {
      console.error('Rate limit check failed:', error)
      // Fail open - allow request if rate limiting fails
      return {
        rateLimited: false,
        remaining: this.config.requests,
        resetTime: Date.now() + this.config.window * 1000,
        total: this.config.requests,
      }
    }
  }
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // General API endpoints (100 requests per minute)
  api: new RateLimiter({
    requests: 100,
    window: 60,
    keyGenerator: keyGenerators.ip,
  }),

  // Auth endpoints (stricter - 10 requests per minute)
  auth: new RateLimiter({
    requests: 10,
    window: 60,
    keyGenerator: keyGenerators.ip,
  }),

  // External API proxying (very strict - 30 requests per minute for OpenFoodFacts)
  external: new RateLimiter({
    requests: 30,
    window: 60,
    keyGenerator: keyGenerators.ip,
  }),

  // File uploads (5 requests per minute)
  upload: new RateLimiter({
    requests: 5,
    window: 60,
    keyGenerator: keyGenerators.ip,
  }),
}

// Convenience function for Next.js Route Handlers
export function checkRateLimit(
  request: NextRequest,
  limiter: RateLimiter = rateLimiters.api,
): Promise<RateLimitResult> {
  return limiter.checkLimit(request)
}

// Initialize Redis storage (call this in your app startup)
export function initializeRedisStorage(redis: any) {
  const redisStorage = new RedisStorage(redis)

  // Update all rate limiters to use Redis
  Object.values(rateLimiters).forEach((limiter) => {
    (limiter as any).storage = redisStorage
  })
}

// Rate limit response headers helper
export function addRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
): Headers {
  headers.set('X-RateLimit-Limit', result.total.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set(
    'X-RateLimit-Reset',
    Math.ceil(result.resetTime / 1000).toString(),
  )

  if (result.rateLimited) {
    headers.set(
      'Retry-After',
      Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
    )
  }

  return headers
}
