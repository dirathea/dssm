import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createDatabase, type DbEnv } from './db'
import { WebAuthnService } from './auth'
import { verifyJWT } from './crypto'
import {
  UserRepository,
  CredentialRepository,
  SecretRepository,
  RecoveryCodeRepository,
} from './repositories'
import * as authHandlers from './handlers/auth'
import * as secretsHandlers from './handlers/secrets'

export interface Env extends DbEnv {
  DB: D1Database
  JWT_SECRET: string
  RP_ID: string
  RP_NAME: string
  DATABASE_PATH?: string // For self-hosted mode
}

// Define context variables type
type Variables = {
  userRepo: UserRepository
  credentialRepo: CredentialRepository
  secretRepo: SecretRepository
  recoveryCodeRepo: RecoveryCodeRepository
  webauthn: WebAuthnService
  userId: string
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// CORS middleware (only for API routes)
app.use(
  '/api/*',
  cors({
    origin: '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

// Security headers middleware (only for API routes)
app.use('/api/*', async (c, next) => {
  await next()

  // Add security headers
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('X-XSS-Protection', '1; mode=block')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
  )
})

// Initialize services middleware (only for API routes)
app.use('/api/*', async (c, next) => {
  // Create database connection
  const db = createDatabase(c.env)

  // Create repositories
  const userRepo = new UserRepository(db)
  const credentialRepo = new CredentialRepository(db)
  const secretRepo = new SecretRepository(db)
  const recoveryCodeRepo = new RecoveryCodeRepository(db)

  // Set repositories in context
  c.set('userRepo', userRepo)
  c.set('credentialRepo', credentialRepo)
  c.set('secretRepo', secretRepo)
  c.set('recoveryCodeRepo', recoveryCodeRepo)

  // Get origin from request, respecting reverse proxy headers
  // This handles: OrbStack, Cloudflare, nginx, Traefik, etc.
  const getOrigin = (c: any): string => {
    // Check for X-Forwarded-Proto header (standard reverse proxy header)
    const forwardedProto = c.req.header('X-Forwarded-Proto')
    const forwardedHost = c.req.header('X-Forwarded-Host') || c.req.header('Host')
    
    if (forwardedProto && forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`
    }
    
    // Cloudflare specific: CF-Visitor header
    const cfVisitor = c.req.header('CF-Visitor')
    if (cfVisitor) {
      try {
        const visitor = JSON.parse(cfVisitor)
        const host = c.req.header('Host')
        if (visitor.scheme && host) {
          return `${visitor.scheme}://${host}`
        }
      } catch {
        // Invalid JSON, continue to fallback
      }
    }
    
    // Fallback to direct request URL
    return new URL(c.req.url).origin
  }

  // Create WebAuthn service
  const webauthnConfig = {
    rpName: c.env.RP_NAME || 'Dead Simple Secret Manager',
    rpID: c.env.RP_ID || 'localhost',
    origin: getOrigin(c),
  }
  const webauthn = new WebAuthnService(userRepo, credentialRepo, webauthnConfig)
  c.set('webauthn', webauthn)

  await next()
})

// JWT authentication middleware for protected routes
const requireAuth = async (c: any, next: any) => {
  try {
    // Try to get token from Authorization header or cookie
    const authHeader = c.req.header('Authorization')
    const cookieHeader = c.req.header('Cookie')

    let token: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieHeader) {
      const match = cookieHeader.match(/token=([^;]+)/)
      if (match) {
        token = match[1]
      }
    }

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const payload = await verifyJWT(token, c.env.JWT_SECRET)
    if (!payload) {
      return c.json({ error: 'Invalid or expired token' }, 401)
    }

    c.set('userId', payload.userId)
    await next()
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

// Auth routes (public)
app.post('/api/auth/register-start', authHandlers.registerStart)
app.post('/api/auth/register-finish', authHandlers.registerFinish)
app.post('/api/auth/login-start', authHandlers.loginStart)
app.post('/api/auth/login-finish', authHandlers.loginFinish)
app.post('/api/auth/recover-start', authHandlers.recoverStart)
app.post('/api/auth/recover-finish', authHandlers.recoverFinish)

// Secret routes (protected)
app.get('/api/secrets', requireAuth, secretsHandlers.listSecrets)
app.post('/api/secrets', requireAuth, secretsHandlers.createSecret)
app.put('/api/secrets/:id', requireAuth, secretsHandlers.updateSecret)
app.delete('/api/secrets/:id', requireAuth, secretsHandlers.deleteSecret)

// Health check endpoint (for Docker health checks)
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() })
})

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
