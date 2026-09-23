import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Database URL — must be set via CUSTOM_DB_URL or DATABASE_URL
const databaseUrl = process.env.CUSTOM_DB_URL || process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is required. ' +
    'Set it in .env file (e.g., CUSTOM_DB_URL=postgresql://user:pass@host:port/db)'
  )
}

// Create PrismaClient with appropriate logging
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    datasources: { db: { url: databaseUrl } },
  })
}

// In production, cache globally to prevent connection pool exhaustion
// In development, also cache to prevent multiple instances during HMR
const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Auto-initialize database on first connection (tables + seed data)
// This ensures the database is ready even on fresh deployments
let _dbInitialized = false

export async function ensureDbInitialized(): Promise<void> {
  if (_dbInitialized) return
  
  try {
    // Check if database has any organizations
    const orgCount = await db.organization.count().catch(() => 0)
    
    if (orgCount === 0) {
      console.log('[DB] Database is empty, auto-initialization will be triggered on /api/setup')
      // Don't auto-run setup here to avoid blocking API requests
      // Setup can be triggered via:
      // 1. ./setup.sh script
      // 2. bun run setup
      // 3. GET /api/setup
      // 4. Deploy platform will run setup automatically
    }
    
    _dbInitialized = true
  } catch (error) {
    console.error('[DB] Initialization check failed:', error)
    _dbInitialized = true // Don't keep retrying
  }
}

export { db }
