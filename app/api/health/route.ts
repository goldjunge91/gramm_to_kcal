import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { getOpenFoodFactsHealth } from '@/lib/api/cached-product-lookup';
import { circuitBreakerManager } from '@/lib/circuit-breaker';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { getURL } from '@/lib/get-url';
import { getRedisHealth } from '@/lib/redis';

export async function GET(request: NextRequest) {
  // Log health check request for monitoring
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  console.info(`[HEALTH] Health check from IP: ${ip}`)

  try {
    // Test database connection
    let dbError = null
    try {
      // Simple query to test database connection
      await db.execute('SELECT 1')
    }
    catch (err) {
      dbError = err
    }

    // Get Redis health status
    const redisHealth = await getRedisHealth()

    // Get OpenFoodFacts health with request for rate limiting context
    const openFoodFactsHealth = await getOpenFoodFactsHealth()

    // Get circuit breaker health
    const circuitBreakerHealth = await circuitBreakerManager.getHealthSummary()

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      url: getURL(),
      database: dbError ? 'error' : 'connected',
      betterAuth: {
        configured: true,
        emailAndPassword: true,
        hasGoogleAuth: !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
      },
      services: {
        redis: redisHealth,
        openFoodFacts: openFoodFactsHealth,
        circuitBreakers: circuitBreakerHealth,
      },
    }

    return NextResponse.json(health)
  }
  catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
