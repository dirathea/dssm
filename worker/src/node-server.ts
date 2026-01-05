import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import app from './index'
import { initDatabase } from './migrate'
import * as fs from 'fs'
import * as path from 'path'

// Environment setup
const PORT = parseInt(process.env.PORT || '3000', 10)
const DB_PATH = process.env.DB_PATH || '/app/data/dssm.db'
const PUBLIC_DIR = process.env.PUBLIC_DIR || './public'

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Serve static files (frontend SPA)
// Must be after API routes to avoid conflicts
app.use('/*', serveStatic({ 
  root: PUBLIC_DIR,
  onNotFound: (filepath, c) => {
    // SPA fallback: serve index.html for non-API routes
    const indexPath = path.join(PUBLIC_DIR, 'index.html')
    if (fs.existsSync(indexPath)) {
      return c.html(fs.readFileSync(indexPath, 'utf-8'))
    }
    return c.notFound()
  }
}))

// Start server
async function start() {
  try {
    // Initialize database with schema
    console.log('🗄️  Initializing database...')
    await initDatabase(DB_PATH)
    
    console.log('')
    console.log('🚀 DSSM Server starting...')
    console.log(`📁 Database: ${DB_PATH}`)
    console.log(`📂 Static files: ${PUBLIC_DIR}`)
    console.log(`🔐 RP_ID: ${process.env.RP_ID || 'localhost'}`)
    console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? '***' + process.env.JWT_SECRET.slice(-4) : '⚠️  NOT SET (using default)'}`)
    console.log('')
    
    serve({
      fetch: app.fetch,
      port: PORT,
    })
    
    console.log(`✅ Server running at http://localhost:${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
    console.log('')
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

start()
