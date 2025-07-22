// Typdefinition für Redis Pipeline Ergebnis
/**
 * Enhanced OpenFoodFacts API integration with caching and rate limiting
 * Implements the recommended 30 req/min for products and 10 req/s for search
 */

import type { Product } from '@/lib/types/types';

import { getRedis } from '@/lib/redis';

import { circuitBreakers } from '../middleware/circuit-breaker';
import {
  isValidEAN13,
  lookupProductByBarcode,
  searchProductsByName,
} from './product-lookup';

type RedisPipelineResult = [unknown, unknown][]

// Cache configuration
const CACHE_CONFIG = {
  PRODUCT_TTL: 24 * 60 * 60, // 24 hours for product data
  SEARCH_TTL: 1 * 60 * 60, // 1 hour for search results
  FAILURE_TTL: 5 * 60, // 5 minutes for failed lookups
} as const

// Rate limiting configuration (aligned with OpenFoodFacts recommendations)
const RATE_LIMITS = {
  PRODUCT_LOOKUP: {
    requests: 30,
    window: 60, // 30 requests per minute
  },
  SEARCH: {
    requests: 10,
    window: 1, // 10 requests per second
  },
} as const

interface RateLimitInfo {
  remaining: number
  resetTime: number
  blocked: boolean
}

// Rate limiter for OpenFoodFacts API
class OpenFoodFactsRateLimiter {
  private redis = getRedis()

  private async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitInfo> {
    if (!this.redis) {
      // No Redis - allow all requests but log warning
      console.warn('Rate limiting unavailable - Redis not configured')
      return {
        remaining: limit,
        resetTime: Date.now() + windowSeconds * 1000,
        blocked: false,
      }
    }

    try {
      const pipeline = this.redis.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, windowSeconds)
      const results = (await pipeline.exec()) as RedisPipelineResult

      let currentCount = 0
      if (
        Array.isArray(results)
        && Array.isArray(results[0])
        && typeof results[0][1] === 'number'
      ) {
        currentCount = results[0][1] as number
      }
      const remaining = Math.max(0, limit - currentCount)
      const resetTime = Date.now() + windowSeconds * 1000

      return {
        remaining,
        resetTime,
        blocked: currentCount > limit,
      }
    }
    catch (error) {
      console.error('Rate limit check failed:', error)
      // Fail open
      return {
        remaining: limit,
        resetTime: Date.now() + windowSeconds * 1000,
        blocked: false,
      }
    }
  }

  async checkProductLookup(clientIP: string): Promise<RateLimitInfo> {
    const key = `openfoodfacts:product:${clientIP}`
    return await this.checkRateLimit(
      key,
      RATE_LIMITS.PRODUCT_LOOKUP.requests,
      RATE_LIMITS.PRODUCT_LOOKUP.window,
    )
  }

  async checkSearch(clientIP: string): Promise<RateLimitInfo> {
    const key = `openfoodfacts:search:${clientIP}`
    return await this.checkRateLimit(
      key,
      RATE_LIMITS.SEARCH.requests,
      RATE_LIMITS.SEARCH.window,
    )
  }
}

// Cache manager for products
class ProductCacheManager {
  private redis = getRedis()

  private getCacheKey(type: 'product' | 'search', identifier: string): string {
    return `openfoodfacts:${type}:${identifier}`
  }

  async getProduct(barcode: string): Promise<any | null> {
    if (!this.redis)
      return null

    try {
      const key = this.getCacheKey('product', barcode)
      const cached = await this.redis.get(key)

      if (typeof cached === 'string') {
        const parsed = JSON.parse(cached)
        return {
          ...parsed,
          source: 'cache',
        }
      }
    }
    catch (error) {
      console.error('Cache read error:', error)
    }

    return null
  }

  async setProduct(
    barcode: string,
    data: any,
    isFailure = false,
  ): Promise<void> {
    if (!this.redis)
      return

    try {
      const key = this.getCacheKey('product', barcode)
      const ttl = isFailure
        ? CACHE_CONFIG.FAILURE_TTL
        : CACHE_CONFIG.PRODUCT_TTL

      await this.redis.setex(
        key,
        ttl,
        JSON.stringify({
          ...data,
          cached_at: Date.now(),
          is_failure: isFailure,
        }),
      )
    }
    catch (error) {
      console.error('Cache write error:', error)
    }
  }

  async getSearchResults(query: string): Promise<any[] | null> {
    if (!this.redis)
      return null

    try {
      const key = this.getCacheKey('search', query.toLowerCase().trim())
      const cached = await this.redis.get(key)

      if (typeof cached === 'string') {
        const parsed = JSON.parse(cached)
        return parsed.map((item: any) => ({
          ...item,
          source: 'cache',
        }))
      }
    }
    catch (error) {
      console.error('Search cache read error:', error)
    }

    return null
  }

  async setSearchResults(query: string, data: any[]): Promise<void> {
    if (!this.redis)
      return

    try {
      const key = this.getCacheKey('search', query.toLowerCase().trim())
      await this.redis.setex(
        key,
        CACHE_CONFIG.SEARCH_TTL,
        JSON.stringify(data),
      )
    }
    catch (error) {
      console.error('Search cache write error:', error)
    }
  }
}

// Initialize instances
const rateLimiter = new OpenFoodFactsRateLimiter()
const cacheManager = new ProductCacheManager()

// Helper to get client IP from request
function getClientIP(request?: Request): string {
  if (!request)
    return 'unknown'

  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  return request.headers.get('x-real-ip') || 'unknown'
}

// Enhanced product lookup with caching and rate limiting
export async function cachedLookupProductByBarcode(
  barcode: string,
  request?: Request,
): Promise<{
  success: boolean
  product?: Omit<Product, 'id'>
  error?: string
  source?: 'cache' | 'api' | 'openfoodfacts'
  rateLimit?: RateLimitInfo
  cached?: boolean
  circuitBreaker?: {
    state: string
    metrics: any
  }
}> {
  // Validate barcode first
  if (!barcode || !isValidEAN13(barcode)) {
    return {
      success: false,
      error: 'Invalid barcode format',
    }
  }

  const clientIP = getClientIP(request)

  // Check rate limit
  const rateLimitInfo = await rateLimiter.checkProductLookup(clientIP)

  if (rateLimitInfo.blocked) {
    return {
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      rateLimit: rateLimitInfo,
    }
  }

  // Check cache first
  const cached = await cacheManager.getProduct(barcode)
  if (cached) {
    if (cached.is_failure) {
      return {
        success: false,
        error: cached.error || 'Product not found (cached)',
        source: 'cache',
        cached: true,
        rateLimit: rateLimitInfo,
      }
    }

    return {
      success: true,
      product: cached.product,
      source: 'cache',
      cached: true,
      rateLimit: rateLimitInfo,
    }
  }

  // Fetch from API with circuit breaker protection
  const circuitResult = await circuitBreakers.openFoodFacts.execute(
    async () => {
      return await lookupProductByBarcode(barcode)
    },
  )

  if (!circuitResult.success) {
    // Circuit breaker failed - cache the failure and return error
    const errorResult = {
      success: false,
      error: circuitResult.error || 'Service temporarily unavailable',
    }

    await cacheManager.setProduct(barcode, errorResult, true)

    return {
      ...errorResult,
      source: 'api',
      cached: false,
      rateLimit: rateLimitInfo,
      circuitBreaker: {
        state: circuitResult.state,
        metrics: circuitResult.metrics,
      },
    }
  }

  const result = circuitResult.data!

  // Cache the result (success or failure)
  await cacheManager.setProduct(barcode, result, !result.success)

  return {
    ...result,
    source: 'api',
    cached: false,
    rateLimit: rateLimitInfo,
    circuitBreaker: {
      state: circuitResult.state,
      metrics: circuitResult.metrics,
    },
  }
}

// Enhanced search with caching and rate limiting
export async function cachedSearchProductsByName(
  query: string,
  limit = 5,
  request?: Request,
): Promise<{
  success: boolean
  products: any[]
  source?: 'cache' | 'api'
  rateLimit?: RateLimitInfo
  cached?: boolean
  circuitBreaker?: {
    state: string
    metrics: any
  }
}> {
  if (!query || query.trim().length < 2) {
    return {
      success: false,
      products: [],
    }
  }

  const clientIP = getClientIP(request)

  // Check rate limit (stricter for search)
  const rateLimitInfo = await rateLimiter.checkSearch(clientIP)

  if (rateLimitInfo.blocked) {
    return {
      success: false,
      products: [],
      rateLimit: rateLimitInfo,
    }
  }

  // Check cache first
  const cached = await cacheManager.getSearchResults(query)
  if (cached) {
    return {
      success: true,
      products: cached,
      source: 'cache',
      cached: true,
      rateLimit: rateLimitInfo,
    }
  }

  // Fetch from API with circuit breaker protection
  const circuitResult = await circuitBreakers.openFoodFacts.execute(
    async () => {
      return await searchProductsByName(query, limit)
    },
  )

  if (!circuitResult.success) {
    console.error('Search API error:', circuitResult.error)
    return {
      success: false,
      products: [],
      rateLimit: rateLimitInfo,
      circuitBreaker: {
        state: circuitResult.state,
        metrics: circuitResult.metrics,
      },
    }
  }

  const results = circuitResult.data!

  // Cache the results
  await cacheManager.setSearchResults(query, results)

  return {
    success: true,
    products: results,
    source: 'api',
    cached: false,
    rateLimit: rateLimitInfo,
    circuitBreaker: {
      state: circuitResult.state,
      metrics: circuitResult.metrics,
    },
  }
}

// Health check for OpenFoodFacts integration
export async function getOpenFoodFactsHealth() {
  const redis = getRedis()
  const circuitStatus = await circuitBreakers.openFoodFacts.getStatus()

  return {
    rateLimit: {
      enabled: !!redis,
      productLimit: `${RATE_LIMITS.PRODUCT_LOOKUP.requests} req/${RATE_LIMITS.PRODUCT_LOOKUP.window}s`,
      searchLimit: `${RATE_LIMITS.SEARCH.requests} req/${RATE_LIMITS.SEARCH.window}s`,
    },
    cache: {
      enabled: !!redis,
      productTTL: `${CACHE_CONFIG.PRODUCT_TTL}s`,
      searchTTL: `${CACHE_CONFIG.SEARCH_TTL}s`,
      failureTTL: `${CACHE_CONFIG.FAILURE_TTL}s`,
    },
    circuitBreaker: {
      state: circuitStatus.state,
      healthy: circuitStatus.isHealthy,
      failures: circuitStatus.metrics.failures,
      successes: circuitStatus.metrics.successes,
      config: {
        failureThreshold: circuitStatus.config.failureThreshold,
        recoveryTimeout: `${circuitStatus.config.recoveryTimeout}ms`,
        timeout: `${circuitStatus.config.timeout}ms`,
      },
    },
    timestamp: new Date().toISOString(),
  }
}

// Export circuit breaker for direct access
export { circuitBreakers as openFoodFactsCircuitBreaker };

