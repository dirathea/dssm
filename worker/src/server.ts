/**
 * Self-hosted Node.js server entry point.
 * Uses @hono/node-server to run the Hono app in Node.js environment.
 *
 * This file imports better-sqlite3 which is a native module,
 * so it should never be bundled by wrangler (Workers build).
 */
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

// Initialize SQLite database
console.log(`Initializing SQLite database: ${DATABASE_PATH}`)
const sqlite = new Database(DATABASE_PATH)
sqlite.pragma('journal_mode = WAL')
const db = drizzle(sqlite, { schema })

// Inject environment variables into the app context
const envBindings = {
  DATABASE_PATH,
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-production',
  RP_ID: process.env.RP_ID || 'localhost',
  RP_NAME: process.env.RP_NAME || 'Dead Simple Secret Manager',
  _sqliteDb: db, // Pre-initialized SQLite connection
}

// Create a wrapper app for static file serving
const serverApp = new Hono()

// Serve static files from public directory (frontend SPA)
serverApp.use('/*', serveStatic({ root: './public' }))

// Start the server
console.log(`Starting DSSM server...`)
console.log(`RP_ID: ${envBindings.RP_ID}`)

serve(
  {
    fetch: (request: Request) => {
      // Pass env bindings to the app
      return app.fetch(request, envBindings as any)
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
