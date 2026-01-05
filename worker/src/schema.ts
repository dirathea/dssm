import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

// Credentials table (WebAuthn passkeys)
export const credentials = sqliteTable('credentials', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  publicKey: text('public_key').notNull(), // Base64 encoded
  counter: integer('counter').notNull(),
  transports: text('transports'), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  userIdIdx: index('idx_credentials_user_id').on(table.userId),
}))

// Secrets table (encrypted)
export const secrets = sqliteTable('secrets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  encryptedValue: text('encrypted_value').notNull(),
  iv: text('iv').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  userIdIdx: index('idx_secrets_user_id').on(table.userId),
}))

// Recovery codes table
export const recoveryCodes = sqliteTable('recovery_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  usedAt: integer('used_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  userIdIdx: index('idx_recovery_codes_user_id').on(table.userId),
  codeHashIdx: index('idx_recovery_codes_hash').on(table.codeHash),
}))

// TypeScript types derived from schema
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Credential = typeof credentials.$inferSelect
export type NewCredential = typeof credentials.$inferInsert

export type Secret = typeof secrets.$inferSelect
export type NewSecret = typeof secrets.$inferInsert

export type RecoveryCode = typeof recoveryCodes.$inferSelect
export type NewRecoveryCode = typeof recoveryCodes.$inferInsert
