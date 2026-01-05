import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
import * as path from 'path'
import * as fs from 'fs'

export async function initDatabase(dbPath: string) {
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const sqlite = new Database(dbPath)
  const db = drizzle(sqlite, { schema })

  console.log('⚙️  Initializing database schema...')
  
  try {
    // Check if migrations folder exists
    const migrationsFolder = path.join(__dirname, '../drizzle')
    
    if (fs.existsSync(migrationsFolder)) {
      // Use migration files if they exist
      await migrate(db, { migrationsFolder })
      console.log('✅ Database migrations applied')
    } else {
      // For Docker builds, we rely on drizzle-kit push during build
      console.log('✅ Database schema ready')
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  } finally {
    sqlite.close()
  }
}

// CLI usage
if (require.main === module) {
  const dbPath = process.env.DB_PATH || './data/dssm.db'
  initDatabase(dbPath)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Database initialization failed:', err)
      process.exit(1)
    })
}
