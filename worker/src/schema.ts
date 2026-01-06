import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  created_at: integer('created_at').notNull(),
})

// Credentials table (WebAuthn passkeys)
// Note: public_key is stored as TEXT (base64 encoded) for Cloudflare Workers compatibility
export const credentials = sqliteTable(
  'credentials',
  {
    id: text('id').primaryKey(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    public_key: text('public_key').notNull(), // Base64 encoded
    counter: integer('counter').notNull(),
    transports: text('transports'), // JSON string of transports array
    created_at: integer('created_at').notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_credentials_user_id').on(table.user_id),
  })
)

// Secrets table (encrypted)
export const secrets = sqliteTable(
  'secrets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    encrypted_value: text('encrypted_value').notNull(),
    iv: text('iv').notNull(),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_secrets_user_id').on(table.user_id),
  })
)

// Recovery codes table
export const recoveryCodes = sqliteTable(
  'recovery_codes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code_hash: text('code_hash').notNull(),
    used: integer('used', { mode: 'boolean' }).notNull().default(false),
    used_at: integer('used_at'),
    created_at: integer('created_at').notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_recovery_codes_user_id').on(table.user_id),
    hashIdx: index('idx_recovery_codes_hash').on(table.code_hash),
  })
)

// TypeScript types inferred from schema
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Credential = typeof credentials.$inferSelect
export type NewCredential = typeof credentials.$inferInsert

export type Secret = typeof secrets.$inferSelect
export type NewSecret = typeof secrets.$inferInsert

export type RecoveryCode = typeof recoveryCodes.$inferSelect
export type NewRecoveryCode = typeof recoveryCodes.$inferInsert
