import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import setRlsPolicies from '../lib/db/migrations/rls-policies'

config({ path: '.env.local' })

// DB-Verbindung herstellen
const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

async function main() {
  await setRlsPolicies(db)
  await client.end()
  console.log('RLS und Policies wurden gesetzt!')
}

main()
