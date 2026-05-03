import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

// La fonction sert uniquement à capturer le type exact (y compris les génériques du schéma).
// prepare: false requis pour Supabase Transaction Pooler (port 6543).
function makeDb() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false })
  return drizzle(client, { schema })
}

type Db = ReturnType<typeof makeDb>

// Singleton : évite la multiplication de connexions lors du hot reload Next.js en dev.
const g = globalThis as typeof globalThis & { _db?: Db }

if (!g._db) {
  g._db = makeDb()
}

export const db: Db = g._db
