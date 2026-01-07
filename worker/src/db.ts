import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import type { D1Database } from '@cloudflare/workers-types'
import * as schema from './schema'

// Re-export types from schema for convenience
export type { User, Credential, Secret, RecoveryCode } from './schema'

// Type for D1 Drizzle instance
type D1DrizzleDatabase = ReturnType<typeof drizzleD1<typeof schema>>

// Union type for database connections
export type DbConnection = D1DrizzleDatabase | any

/**
 * Environment configuration for database initialization
 */
export interface DbEnv {
  DB?: D1Database // Cloudflare D1 binding
  DATABASE_PATH?: string // Path for self-hosted SQLite
  _sqliteDb?: any // Pre-initialized SQLite connection (set by server.ts)
}

/**
 * Creates a database connection based on the environment.
 *
 * - Cloudflare Workers: Uses D1 binding (env.DB)
 * - Self-hosted: Uses pre-initialized SQLite from env._sqliteDb
 */
export function createDatabase(env: DbEnv): DbConnection {
  // Cloudflare D1
  if (env.DB && typeof (env.DB as any).prepare === 'function') {
    return drizzleD1(env.DB as D1Database, { schema })
  }

  // Self-hosted SQLite (pre-initialized by server.ts)
  if (env._sqliteDb) {
    return env._sqliteDb
  }

  // If DATABASE_PATH is set but no _sqliteDb, user forgot to initialize
  if (env.DATABASE_PATH) {
    throw new Error(
      'SQLite not initialized. In self-hosted mode, the database must be initialized before use.'
    )
  }

  throw new Error(
    'No database configuration found. Set DB (D1) or DATABASE_PATH (SQLite) environment variable.'
  )
}

/**
 * Placeholder for close - actual implementation in server.ts
 */
export function closeDatabase(): void {
  // This is a no-op in Workers mode
  // In Node.js mode, the server.ts handles cleanup
}
