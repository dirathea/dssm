/**
 * Self-hosted Node.js server entry point.
 * Uses @hono/node-server to run the Hono app in Node.js environment.
 *
 * This file imports better-sqlite3 which is a native module,
 * so it should never be bundled by wrangler (Workers build).
 */
import fs from 'fs'
import path from 'path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { Hono } from 'hono'
import app from './index'
import * as schema from './schema'

// Environment configuration
const PORT = parseInt(process.env.PORT || '8787', 10)
const HOST = process.env.HOST || '0.0.0.0'
const DATABASE_PATH = process.env.DATABASE_PATH || './data/dssm.db'

// Ensure data directory exists
const dataDir = path.dirname(DATABASE_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Initialize SQLite database
console.log(`Initializing SQLite database: ${DATABASE_PATH}`)
const sqlite = new Database(DATABASE_PATH)
sqlite.pragma('journal_mode = WAL')

// Run migrations
console.log('Running database migrations...')
const migrationsDir = path.join(__dirname, '..', 'drizzle')
if (fs.existsSync(migrationsDir)) {
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()
  
  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    // Split by statement breakpoint and execute each statement
    const statements = sql.split('--> statement-breakpoint')
    for (const stmt of statements) {
      const trimmed = stmt.trim()
      if (trimmed) {
        try {
          sqlite.exec(trimmed)
        } catch (error: any) {
          // Ignore "table already exists" errors
          if (!error.message.includes('already exists')) {
            console.error(`Migration error in ${file}:`, error.message)
          }
        }
      }
    }
  }
  console.log('Migrations complete.')
} else {
  console.warn('No migrations directory found at:', migrationsDir)
}

const db = drizzle(sqlite, { schema })

// Inject environment variables into the app context
const envBindings = {
  DATABASE_PATH,
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-production',
  RP_ID: process.env.RP_ID || 'localhost',
  RP_NAME: process.env.RP_NAME || 'TapLock',
  _sqliteDb: db, // Pre-initialized SQLite connection
}

// Create a combined app that serves both API and static files
const serverApp = new Hono()

// Mount the API routes first (they take priority)
serverApp.route('/', app)

// Serve static files from public directory (frontend SPA)
serverApp.use('*', serveStatic({ root: './public' }))

// Fallback to index.html for SPA routing
serverApp.use('*', serveStatic({ root: './public', path: 'index.html' }))

// Start the server
console.log(`Starting TapLock server...`)
console.log(`RP_ID: ${envBindings.RP_ID}`)

serve(
  {
    fetch: (request: Request) => {
      // Pass env bindings to the app
      return serverApp.fetch(request, envBindings as any)
    },
    port: PORT,
    hostname: HOST,
  },
  (info) => {
    console.log(`Server running at http://${info.address}:${info.port}`)
  }
)

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down...')
  sqlite.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
