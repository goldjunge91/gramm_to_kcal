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
  } as const;

  // Log environment status for debugging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log("Environment Variables Status:");
    Object.entries(env).forEach(([key, value]) => {
      console.log(`${key}: ${value ? "✅ Set" : "❌ Missing"}`);
    });
  }

  // Validate required environment variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NODE_ENV",
    "NEXT_PUBLIC_NODE_ENV",
    "STORAGE_KEY",
    "RECENT_SCANS_KEY",
  ] as const;

  const missingVars = requiredEnvVars.filter(
    (key) => !env[key] || env[key] === "<>" || env[key] === "",
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please check your Vercel environment variables configuration.\n" +
        "See: https://vercel.com/docs/projects/environment-variables",
    );
  }

  return env;
}

export const env = createEnv();
