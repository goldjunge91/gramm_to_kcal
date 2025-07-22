// Load environment variables from .env.local
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

import { env } from "./lib/env";

config({ path: ".env.local" });

if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
}

export default defineConfig({
    schema: "./lib/db/schemas/index.ts",
    out: "./lib/db/drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: env.DATABASE_URL,
    },
    verbose: true,
    strict: true,
});
