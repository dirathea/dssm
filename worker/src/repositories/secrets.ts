import { eq, and, desc } from 'drizzle-orm'
import { secrets, type Secret } from '../schema'
import type { DbConnection } from '../db'

export class SecretRepository {
  constructor(private db: DbConnection) {}

  async getSecretsByUser(userId: string): Promise<Secret[]> {
    const results = await this.db
      .select()
      .from(secrets)
      .where(eq(secrets.user_id, userId))
      .orderBy(desc(secrets.created_at))
      .all()

    return results
  }

  async getSecret(secretId: number, userId: string): Promise<Secret | null> {
    const result = await this.db
      .select()
      .from(secrets)
      .where(and(eq(secrets.id, secretId), eq(secrets.user_id, userId)))
      .get()

    return result ?? null
  }

  async createSecret(
    userId: string,
    name: string,
    encryptedValue: string,
    iv: string
  ): Promise<Secret> {
    const now = Date.now()

    const result = await this.db
      .insert(secrets)
      .values({
        user_id: userId,
        name,
        encrypted_value: encryptedValue,
        iv,
        created_at: now,
        updated_at: now,
      })
      .returning()
      .get()

    if (!result) {
      throw new Error('Failed to create secret')
    }

    return result
  }

  async updateSecret(
    secretId: number,
    userId: string,
    name?: string,
    encryptedValue?: string,
    iv?: string
  ): Promise<Secret | null> {
    const secret = await this.getSecret(secretId, userId)
    if (!secret) return null

    const updatedName = name ?? secret.name
    const updatedValue = encryptedValue ?? secret.encrypted_value
    const updatedIv = iv ?? secret.iv
    const now = Date.now()

    await this.db
      .update(secrets)
      .set({
        name: updatedName,
        encrypted_value: updatedValue,
        iv: updatedIv,
        updated_at: now,
      })
      .where(and(eq(secrets.id, secretId), eq(secrets.user_id, userId)))
      .run()

    return this.getSecret(secretId, userId)
  }

  async deleteSecret(secretId: number, userId: string): Promise<boolean> {
    // First check if the secret exists
    const existing = await this.getSecret(secretId, userId)
    if (!existing) {
      return false
    }

    await this.db
      .delete(secrets)
      .where(and(eq(secrets.id, secretId), eq(secrets.user_id, userId)))
      .run()

    return true
  }
}
