import { config } from 'dotenv'
import type { Config } from 'drizzle-kit'

config({ path: '.env.local' })

// Pour db:push, utiliser DATABASE_URL_DIRECT (connexion directe port 5432) si disponible.
// L'app utilise DATABASE_URL (pooler port 6543) mais drizzle-kit a besoin de la connexion directe.
const dbUrl = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL!

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
} satisfies Config
