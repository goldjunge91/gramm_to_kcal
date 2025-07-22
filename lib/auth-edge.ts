import { betterAuth } from 'better-auth'

import { env } from './env'

// Edge-compatible auth configuration without database connection
// This is used for middleware and other edge runtime contexts
export const auth = betterAuth({
  // Use environment variable for database URL in edge runtime
  database: {
    type: 'postgres',
    url: env.DATABASE_URL!,
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
    ? {
        google: {
          clientId: env.AUTH_GOOGLE_ID,
          clientSecret: env.AUTH_GOOGLE_SECRET,
        },
      }
    : {},
})
