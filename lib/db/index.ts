import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

config({ path: ".env.local" }); // Load environment variables

// Disable prefetch as it is not supported for "Transaction" pool mode in Supabase
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client, { schema });
export type Database = typeof db;
