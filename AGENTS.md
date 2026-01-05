# AGENTS.md - Development Guide for AI Coding Agents

This guide provides essential information for AI agents working on the DSSM (Dead Simple Secret Manager) codebase.

## Project Overview

DSSM is a minimalist secret manager with passkey authentication, built with:
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Cloudflare Workers or Node.js + Hono framework
- **Database**: D1 (Cloudflare) or SQLite (Docker) via Drizzle ORM
- **Auth**: WebAuthn/Passkeys (@simplewebauthn)
- **Encryption**: Client-side AES-256-GCM
- **Deployment**: Cloudflare Workers or Docker (self-hosted)

The app uses a **neobrutalist design** with thick borders, brutal shadows, and bold colors.

## Project Structure

```
dssm/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui library components (DO NOT MODIFY!)
│   │   │   ├── SecretItem/   # Secret list item components
│   │   │   └── *.tsx         # Other components
│   │   ├── pages/            # Page components (Login, Register, Vault)
│   │   ├── api.ts            # API client (ApiClient class)
│   │   ├── crypto.ts         # Client-side encryption utilities
│   │   ├── auth.tsx          # Auth context provider
│   │   └── index.css         # Design system + Tailwind config
│   └── package.json
├── worker/            # Cloudflare Worker backend
│   ├── src/
│   │   ├── handlers/         # Route handlers (auth.ts, secrets.ts)
│   │   ├── index.ts          # Main Hono app + middleware
│   │   ├── db.ts             # D1 database queries (Database class)
│   │   ├── auth.ts           # WebAuthn service
│   │   └── crypto.ts         # JWT + crypto utilities
│   ├── migrations/           # D1 migrations
│   ├── schema.sql            # Database schema
│   └── wrangler.toml         # Cloudflare config
└── package.json       # Root workspace scripts
```

## Build/Lint/Test Commands

### Root-level Commands (from `/`)
```bash
npm run install:all    # Install all dependencies (root + frontend + worker)
npm run dev            # Build frontend + run worker in watch mode
npm run build          # Build frontend only
npm run deploy         # Build frontend + deploy worker to Cloudflare
```

### Frontend Commands (from `/frontend`)
```bash
npm run dev            # Start Vite dev server (http://localhost:5173)
npm run build          # Build production bundle (output: dist/)
npm run preview        # Preview production build
npm run lint           # Run ESLint (TypeScript strict mode)
```

### Worker Commands (from `/worker`)
```bash
# Cloudflare Workers mode
npm run dev            # Start Wrangler dev server (http://localhost:8787)
npm run deploy         # Deploy to Cloudflare Workers
npm run d1:create      # Create D1 database
npm run d1:migrate     # Run database migrations

# Node.js/Docker mode
npm run dev:node       # Start Node.js server (http://localhost:3000)
npm run build:node     # Build TypeScript for Node.js
npm run start:node     # Start built Node.js server

# Drizzle ORM (Database)
npm run db:generate    # Generate migration from schema changes
npm run db:migrate     # Run migrations (Node.js mode)
npm run db:studio      # Visual database browser (dev tool)
npm run db:push        # Push schema directly (dev only)
```

### Docker Commands (from `/`)
```bash
# Quick start
docker-compose up -d              # Start in background
docker-compose logs -f            # View logs
docker-compose down               # Stop and remove containers

# Build from source
docker build -t dssm:local .      # Build image
docker run -p 3000:3000 dssm:local  # Run container

# Development
docker-compose -f docker-compose.dev.yml up  # Dev mode with hot reload
```

### No Test Framework
**Important**: This project currently has **no test runner** or test files. Do not attempt to run `npm test`.

## Code Style Guidelines

### TypeScript
- **Strict mode enabled**: All TypeScript strict checks are ON
- Always use explicit types for function parameters and return values
- Use interfaces for object shapes, especially API responses and database models
- No `any` types except for external library responses that need processing
- Enable `noUnusedLocals` and `noUnusedParameters`

### Imports
- Use **relative imports** for local modules: `import { api } from '../api'`
- Use **@/ alias** for frontend src imports: `import { Button } from '@/components/ui/button'`
- Group imports: external packages → internal modules → types
- No default exports except for page components and main entry files
- Named exports preferred for utilities and services

Example:
```typescript
// Good
import { Context } from 'hono'
import { Database } from '../db'
import { WebAuthnService } from '../auth'

export async function loginStart(c: Context) { ... }
```

### Formatting
- **2 spaces** for indentation (no tabs)
- **Single quotes** for strings (except JSX uses double quotes)
- **Semicolons required** at end of statements
- **Trailing commas** in multiline objects/arrays
- Max line length: ~100 characters (soft limit)
- Use ESLint autofix for consistent formatting

### Naming Conventions
- **Variables/Functions**: `camelCase` (e.g., `createSecret`, `userId`)
- **Classes**: `PascalCase` (e.g., `Database`, `ApiClient`, `WebAuthnService`)
- **Interfaces/Types**: `PascalCase` (e.g., `User`, `Secret`, `Credential`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`, `JWT_SECRET`)
- **React Components**: `PascalCase` files and exports (e.g., `SecretForm.tsx`)
- **Database columns**: `snake_case` (e.g., `user_id`, `created_at`, `encrypted_value`)
- **Private class methods**: prefix with underscore: `_privateMethod()`

### React/JSX Conventions
- **Functional components only** with hooks (no class components)
- Use `interface` for component props (named `ComponentNameProps`)
- Destructure props in function signature
- Use `const` for component declarations
- Event handlers: prefix with `handle` (e.g., `handleEdit`, `handleDelete`)
- State setters: prefix with `set` (e.g., `setShowDialog`, `setLoading`)

Example:
```typescript
interface SecretFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
}

export default function SecretForm({ open, onOpenChange, token }: SecretFormProps) {
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async () => { ... }
  
  return (...)
}
```

### Error Handling
- **Frontend**: Use try-catch blocks, show user-friendly toast messages via `sonner`
- **Backend**: Return proper HTTP status codes (400, 401, 404, 500) with `{ error: string }` JSON
- Log errors to console with context: `console.error('Login finish error:', error)`
- Never expose sensitive information in error messages
- Validate all user inputs before processing

Example (Backend):
```typescript
try {
  const { userId } = await c.req.json()
  if (!userId || typeof userId !== 'string') {
    return c.json({ error: 'Invalid userId' }, 400)
  }
  // ... process request
} catch (error) {
  console.error('Operation failed:', error)
  return c.json({ error: 'Internal server error' }, 500)
}
```

Example (Frontend):
```typescript
try {
  await api.createSecret(token, name, encryptedValue, iv)
  toast.success('Secret created!')
} catch (error) {
  toast.error(error instanceof Error ? error.message : 'Failed to create secret')
}
```

## Design System & Styling

### CRITICAL: Do Not Modify UI Library Components
**NEVER modify files in `/frontend/src/components/ui/`** - these are shadcn/ui library components. 

Instead, override styles using `className` props where components are used:
```typescript
// Good
<TableRow className="bg-white hover:bg-gray-50">...</TableRow>

// Bad - don't modify table.tsx directly
```

### Tailwind & CSS
- Use Tailwind utility classes for all styling
- Design tokens defined in `/frontend/src/index.css`:
  - `bg-main` (purple), `bg-background` (light purple), `bg-secondary-background` (white)
  - `border-border` (black), `shadow-brutal` (4px offset shadow)
- Custom utilities: `shadow-brutal`, `bg-main`, `text-foreground`
- Responsive prefixes: `sm:`, `md:`, `lg:` (use `md:` for desktop vs mobile splits)
- Hover states: always add hover variants for interactive elements

### Neobrutalist Design Principles
- **Thick borders**: Use `border-2` or `border-4` with `border-black`
- **Brutal shadows**: Use `shadow-brutal` class (4px offset shadow)
- **Bold colors**: Primary purple (`bg-main`), white backgrounds, black text
- **No subtle gradients**: Solid colors only
- **Sharp corners**: Use `rounded-base` (5px) or `rounded-md`

## Database Layer (Drizzle ORM)

DSSM uses **Drizzle ORM** for database abstraction, supporting both:
- **Cloudflare D1** (production on Workers)
- **SQLite** (Docker/Node.js via better-sqlite3)

### Schema Definition
All tables defined in `worker/src/schema.ts` using Drizzle schema builder:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

// Auto-generated TypeScript types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

### Runtime Detection
The database client automatically detects the runtime environment:

```typescript
// worker/src/db-client.ts
export function createDrizzleClient(env: any) {
  if (isCloudflare()) {
    return drizzleD1(env.DB, { schema })  // D1 for Cloudflare
  } else {
    return drizzleSqlite(sqlite, { schema })  // SQLite for Node.js
  }
}
```

### Database Queries
Use Drizzle relational queries (type-safe):

```typescript
import { eq, and, desc } from 'drizzle-orm'
import * as schema from './schema'

// Good - Drizzle relational queries
await db.query.users.findFirst({
  where: eq(schema.users.id, userId)
})

await db.query.secrets.findMany({
  where: eq(schema.secrets.userId, userId),
  orderBy: desc(schema.secrets.createdAt),
})

// Good - Drizzle query builder
await db.insert(schema.secrets).values({
  userId,
  name,
  encryptedValue,
  iv,
  createdAt: new Date(),
  updatedAt: new Date(),
}).returning()

// Bad - raw SQL (avoid unless necessary)
await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`)
```

### Migrations
- **Generation**: `npm run db:generate` (creates SQL from schema changes)
- **Apply**: `npm run db:migrate` (runs migrations in Node.js)
- **Dev tool**: `npm run db:studio` (visual database browser)
- **Dev push**: `npm run db:push` (push schema directly, dev only)

**Important**: For Cloudflare D1, use `wrangler d1 execute` for migrations.

### Database Class Usage
The `Database` class wraps Drizzle queries with backward-compatible interface:

```typescript
import { createDrizzleClient } from './db-client'
import { Database } from './db'

const drizzleDb = createDrizzleClient(c.env)
const db = new Database(drizzleDb)

// Use methods as before
const user = await db.getUser(userId)
const secrets = await db.getSecretsByUser(userId)
```

## Common Patterns

### API Client Usage
```typescript
import { api } from '@/api'

// Auth
const response = await api.loginFinish(userId, credential)

// Secrets (require token)
const secrets = await api.getSecrets(token)
await api.createSecret(token, name, encryptedValue, iv)
```

### Authentication Middleware
Protected routes use `requireAuth` middleware in `/worker/src/index.ts`:
```typescript
app.get('/api/secrets', requireAuth, secretsHandlers.listSecrets)
```

## Docker Development

### Local Development with Docker
```bash
# Run Node.js server locally (hot reload)
cd worker && npm run dev:node

# Or use Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f dssm
```

### Testing Both Runtimes
- **Cloudflare**: `npm run dev` (from root)
- **Node.js**: `npm run dev:node` (from worker/)
- Both should produce identical API responses

### Important: Runtime Compatibility
- All queries must work in **both** D1 and SQLite
- Avoid SQLite-specific extensions (e.g., FTS5, JSON1)
- Test changes in both runtimes before committing
- Use Drizzle relational queries for maximum compatibility

## Important Rules

1. **No direct file modifications in `/frontend/src/components/ui/`** - override with className only
2. **Client-side encryption** - secrets must be encrypted before sending to API
3. **JWT tokens** - include `Authorization: Bearer ${token}` header for protected endpoints
4. **Same-origin architecture** - frontend and backend deployed as single Worker
5. **Type safety** - never use `any` without good reason; use interfaces for all API/DB models
6. **No test files** - do not create or run tests (no framework installed)
7. **Responsive design** - mobile-first approach, use `md:` breakpoint for desktop layouts
8. **Error handling** - always return proper status codes and user-friendly messages
