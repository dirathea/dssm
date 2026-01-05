import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

export type DrizzleDB = ReturnType<typeof createDrizzleClient>

// Runtime detection
export function isCloudflare(): boolean {
  return typeof caches !== 'undefined' && 'default' in caches
}

// Factory function: creates appropriate Drizzle client
export function createDrizzleClient(env: any) {
  if (isCloudflare()) {
    // Cloudflare Workers mode - use D1
    if (!env.DB) {
      throw new Error('D1 database binding not found')
    }
    return drizzleD1(env.DB, { schema })
  } else {
    // Node.js mode - use better-sqlite3
    // Dynamic import to avoid breaking Workers build
    const Database = require('better-sqlite3')
    const dbPath = process.env.DB_PATH || '/app/data/dssm.db'
    const sqlite = new Database(dbPath)
    
    // Enable WAL mode for better concurrency
    sqlite.pragma('journal_mode = WAL')
    
    return drizzleSqlite(sqlite, { schema })
  }
}
