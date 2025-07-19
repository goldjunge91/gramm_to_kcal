/* eslint-disable require-await */
import { NextResponse } from "next/server";

export async function GET() {
  // Test if environment variables are available
  const envStatus = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    // Show first few characters for debugging (never expose full keys)
    supabaseUrlPreview: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20)}...`,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(envStatus);
}
