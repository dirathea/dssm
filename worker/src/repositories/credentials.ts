import { eq } from 'drizzle-orm'
import { credentials, type Credential } from '../schema'
import type { DbConnection } from '../db'
import { base64ToArrayBuffer, arrayBufferToBase64 } from '../utils/encoding'

// Extended credential type with ArrayBuffer for public_key (for application use)
export interface CredentialWithBuffer {
  id: string
  user_id: string
  public_key: ArrayBuffer
  counter: number
  transports: string | null
  created_at: number
}

export class CredentialRepository {
  constructor(private db: DbConnection) {}

  async getCredential(credentialId: string): Promise<CredentialWithBuffer | null> {
    const result = await this.db
      .select()
      .from(credentials)
      .where(eq(credentials.id, credentialId))
      .get()

    if (!result) return null

    return {
      ...result,
      public_key: base64ToArrayBuffer(result.public_key),
    }
  }

  async getCredentialsByUser(userId: string): Promise<CredentialWithBuffer[]> {
    const results = await this.db
      .select()
      .from(credentials)
      .where(eq(credentials.user_id, userId))
      .all()

    return results.map((row: typeof results[number]) => ({
      ...row,
      public_key: base64ToArrayBuffer(row.public_key),
    }))
  }

  async createCredential(
    credentialId: string,
    userId: string,
    publicKey: ArrayBuffer,
    counter: number,
    transports: string[] | undefined
  ): Promise<CredentialWithBuffer> {
    const createdAt = Date.now()
    const transportStr = transports ? JSON.stringify(transports) : null
    const publicKeyBase64 = arrayBufferToBase64(publicKey)

    await this.db
      .insert(credentials)
      .values({
        id: credentialId,
        user_id: userId,
        public_key: publicKeyBase64,
        counter,
        transports: transportStr,
        created_at: createdAt,
      })
      .run()

    return {
      id: credentialId,
      user_id: userId,
      public_key: publicKey,
      counter,
      transports: transportStr,
      created_at: createdAt,
    }
  }

  async updateCredentialCounter(credentialId: string, counter: number): Promise<void> {
    await this.db
      .update(credentials)
      .set({ counter })
      .where(eq(credentials.id, credentialId))
      .run()
  }
}
