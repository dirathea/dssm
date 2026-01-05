import { eq, and, desc } from 'drizzle-orm'
import type { DrizzleDB } from './db-client'
import * as schema from './schema'

// Re-export types for backward compatibility
export type { User, Credential, Secret, RecoveryCode } from './schema'

// Legacy interface for compatibility with existing code
export interface Credential {
  id: string
  user_id: string
  public_key: ArrayBuffer
  counter: number
  transports: string | null
  created_at: number
}

export class Database {
  constructor(private db: DrizzleDB) {}

  // User operations
  async getUser(userId: string) {
    return await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    })
  }

  async createUser(userId: string) {
    const [user] = await this.db
      .insert(schema.users)
      .values({
        id: userId,
        createdAt: new Date(),
      })
      .returning()
    return user
  }

  // Credential operations
  async getCredential(credentialId: string): Promise<Credential | null> {
    const result = await this.db.query.credentials.findFirst({
      where: eq(schema.credentials.id, credentialId),
    })

    if (!result) return null

    // Convert base64 to ArrayBuffer for compatibility
    return {
      id: result.id,
      user_id: result.userId,
      public_key: base64ToArrayBuffer(result.publicKey),
      counter: result.counter,
      transports: result.transports,
      created_at: result.createdAt.getTime(),
    }
  }

  async getCredentialsByUser(userId: string): Promise<Credential[]> {
    const results = await this.db.query.credentials.findMany({
      where: eq(schema.credentials.userId, userId),
    })

    return results.map((row) => ({
      id: row.id,
      user_id: row.userId,
      public_key: base64ToArrayBuffer(row.publicKey),
      counter: row.counter,
      transports: row.transports,
      created_at: row.createdAt.getTime(),
    }))
  }

  async createCredential(
    credentialId: string,
    userId: string,
    publicKey: ArrayBuffer,
    counter: number,
    transports?: string[]
  ): Promise<Credential> {
    // Convert ArrayBuffer to base64
    const publicKeyBase64 = arrayBufferToBase64(publicKey)
    const transportStr = transports ? JSON.stringify(transports) : null

    const [credential] = await this.db
      .insert(schema.credentials)
      .values({
        id: credentialId,
        userId,
        publicKey: publicKeyBase64,
        counter,
        transports: transportStr,
        createdAt: new Date(),
      })
      .returning()

    // Convert back to ArrayBuffer for return type compatibility
    return {
      id: credential.id,
      user_id: credential.userId,
      public_key: publicKey,
      counter: credential.counter,
      transports: transportStr,
      created_at: credential.createdAt.getTime(),
    }
  }

  async updateCredentialCounter(credentialId: string, counter: number): Promise<void> {
    await this.db
      .update(schema.credentials)
      .set({ counter })
      .where(eq(schema.credentials.id, credentialId))
  }

  // Secret operations
  async getSecretsByUser(userId: string) {
    return await this.db.query.secrets.findMany({
      where: eq(schema.secrets.userId, userId),
      orderBy: desc(schema.secrets.createdAt),
    })
  }

  async getSecret(secretId: number, userId: string) {
    return await this.db.query.secrets.findFirst({
      where: and(
        eq(schema.secrets.id, secretId),
        eq(schema.secrets.userId, userId)
      ),
    })
  }

  async createSecret(
    userId: string,
    name: string,
    encryptedValue: string,
    iv: string
  ) {
    const now = new Date()
    const [secret] = await this.db
      .insert(schema.secrets)
      .values({
        userId,
        name,
        encryptedValue,
        iv,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return secret
  }

  async updateSecret(
    secretId: number,
    userId: string,
    name?: string,
    encryptedValue?: string,
    iv?: string
  ) {
    const secret = await this.getSecret(secretId, userId)
    if (!secret) return null

    const [updated] = await this.db
      .update(schema.secrets)
      .set({
        name: name ?? secret.name,
        encryptedValue: encryptedValue ?? secret.encryptedValue,
        iv: iv ?? secret.iv,
        updatedAt: new Date(),
      })
      .where(and(
        eq(schema.secrets.id, secretId),
        eq(schema.secrets.userId, userId)
      ))
      .returning()

    return updated
  }

  async deleteSecret(secretId: number, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.secrets)
      .where(and(
        eq(schema.secrets.id, secretId),
        eq(schema.secrets.userId, userId)
      ))
      .returning()

    return result.length > 0
  }

  // Recovery code operations
  async createRecoveryCodes(userId: string, codeHashes: string[]): Promise<void> {
    const now = new Date()
    await this.db.insert(schema.recoveryCodes).values(
      codeHashes.map((hash) => ({
        userId,
        codeHash: hash,
        used: false,
        createdAt: now,
      }))
    )
  }

  async getRecoveryCodesByUser(userId: string) {
    return await this.db.query.recoveryCodes.findMany({
      where: eq(schema.recoveryCodes.userId, userId),
      orderBy: desc(schema.recoveryCodes.createdAt),
    })
  }

  async getUnusedRecoveryCodeByHash(userId: string, codeHash: string) {
    return await this.db.query.recoveryCodes.findFirst({
      where: and(
        eq(schema.recoveryCodes.userId, userId),
        eq(schema.recoveryCodes.codeHash, codeHash),
        eq(schema.recoveryCodes.used, false)
      ),
    })
  }

  async markRecoveryCodeAsUsed(codeId: number): Promise<void> {
    await this.db
      .update(schema.recoveryCodes)
      .set({ 
        used: true, 
        usedAt: new Date() 
      })
      .where(eq(schema.recoveryCodes.id, codeId))
  }

  async deleteAllRecoveryCodes(userId: string): Promise<void> {
    await this.db
      .delete(schema.recoveryCodes)
      .where(eq(schema.recoveryCodes.userId, userId))
  }
}

// Helper functions for ArrayBuffer <-> Base64 conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}
