/**
 * Environment variable validation and access
 * This helps debug missing environment variables in Vercel
 */

function createEnv() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
    STORAGE_KEY: process.env.NEXT_PUBLIC_STORAGE_KEY,
    RECENT_SCANS_KEY: process.env.NEXT_PUBLIC_RECENT_SCANS_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    FORCE_BUILD: process.env.FORCE_BUILD,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    ANALYZE: process.env.ANALYZE,

  } as const

  // Log environment status for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Environment Variables Status:')
    Object.entries(env).forEach(([key, value]) => {
      console.log(`${key}: ${value ? '✅ Set' : '❌ Missing'}`)
    })
  }

  // Validate required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NODE_ENV',
    'NEXT_PUBLIC_NODE_ENV',
    'STORAGE_KEY',
    'RECENT_SCANS_KEY',
  ] as const

  // Optional environment variables - features will be disabled if missing
  const optionalEnvVars = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'AUTH_GOOGLE_ID',
    'AUTH_GOOGLE_SECRET',
  ] as const

  const missingVars = requiredEnvVars.filter(
    key => !env[key] || env[key] === '<>' || env[key] === '',
  )

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n`
      + 'Please check your Vercel environment variables configuration.\n'
      + 'See: https://vercel.com/docs/projects/environment-variables',
    )
  }

  // Warn about missing optional variables
  const missingOptionalVars = optionalEnvVars.filter(
    key => !env[key] || env[key] === '<>' || env[key] === '',
  )

  if (
    missingOptionalVars.length > 0
    && process.env.NODE_ENV === 'development'
  ) {
    // Only warn about Redis if actually missing
    const missingRedis = missingOptionalVars.filter(v => v.includes('REDIS'))
    const missingAuth = missingOptionalVars.filter(v => v.includes('AUTH_GOOGLE'))

    if (missingRedis.length > 0) {
      console.warn(
        `⚠️ Optional Redis variables missing: ${missingRedis.join(', ')}\n`
        + 'Rate limiting will use in-memory storage. For production, configure Redis.',
      )
    }

    if (missingAuth.length > 0) {
      console.warn(
        `⚠️ Google OAuth not configured: ${missingAuth.join(', ')}\n`
        + 'Google OAuth login will be disabled.',
      )
    }
  }

  return env
}

export const env = createEnv()
