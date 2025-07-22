import { NextResponse } from 'next/server'

import { env } from '@/lib/env'

export async function GET() {
  // Test if environment variables are available
  const envStatus = {
    hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasDatabaseUrl: !!env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    // Show first few characters for debugging (never expose full keys)
    supabaseUrlPreview: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20)}...`,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(envStatus)
}
