import { Redis } from '@upstash/redis'

import { initializeRedisStorage } from './rate-limit'

// Redis configuration
let redis: Redis | null = null

// Initialize Redis connection
export function initializeRedis() {
  // Only initialize if we have the required environment variables
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl || !redisToken) {
    console.warn('Redis not configured - using in-memory rate limiting')
    return null
  }

  try {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })

    // Initialize rate limiting with Redis
    initializeRedisStorage(redis)

    console.log('Redis initialized for rate limiting')
    return redis
  }
  catch (error) {
    console.error('Failed to initialize Redis:', error)
    return null
  }
}

// Get Redis instance
export function getRedis(): Redis | null {
  if (!redis) {
    return initializeRedis()
  }
  return redis
}

// Test Redis connection
export async function testRedisConnection(): Promise<boolean> {
  const redisInstance = getRedis()
  if (!redisInstance) {
    return false
  }

  try {
    await redisInstance.ping()
    return true
  }
  catch (error) {
    console.error('Redis connection test failed:', error)
    return false
  }
}

// Redis health check for monitoring
export async function getRedisHealth() {
  const redisInstance = getRedis()

  if (!redisInstance) {
    return {
      status: 'disabled',
      message: 'Redis not configured',
      timestamp: new Date().toISOString(),
    }
  }

  try {
    const start = Date.now()
    await redisInstance.ping()
    const latency = Date.now() - start

    return {
      status: 'healthy',
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
    }
  }
  catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

// Export types
export type { Redis }
