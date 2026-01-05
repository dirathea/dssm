import { D1Database } from '@cloudflare/workers-types'

// Helper functions for base64 encoding/decoding without Buffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export interface User {
  id: string
  created_at: number
}

export interface Credential {
  id: string
  user_id: string
  public_key: ArrayBuffer
  counter: number
  transports: string | null
  created_at: number
}

export interface Secret {
  id: number
  user_id: string
  name: string
  encrypted_value: string
  iv: string
  created_at: number
  updated_at: number
}

export interface RecoveryCode {
  id: number
  user_id: string
  code_hash: string
  used: boolean
  used_at: number | null
  created_at: number
}

export class Database {
  constructor(private db: D1Database) {}

  // User operations
  async getUser(userId: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first<User>()
    return result
  }

  async createUser(userId: string): Promise<User> {
    const createdAt = Date.now()
    await this.db
      .prepare('INSERT INTO users (id, created_at) VALUES (?, ?)')
      .bind(userId, createdAt)
      .run()
    return { id: userId, created_at: createdAt }
  }

  // Credential operations
  async getCredential(credentialId: string): Promise<Credential | null> {
    const result = await this.db
      .prepare('SELECT * FROM credentials WHERE id = ?')
      .bind(credentialId)
      .first<any>()

    if (!result) return null

    return {
      ...result,
      public_key: base64ToArrayBuffer(result.public_key),
    }
  }

  async getCredentialsByUser(userId: string): Promise<Credential[]> {
    const results = await this.db
      .prepare('SELECT * FROM credentials WHERE user_id = ?')
      .bind(userId)
      .all<any>()

    if (!results.results) return []

    return results.results.map((row) => ({
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
  ): Promise<Credential> {
    const createdAt = Date.now()
    const transportStr = transports ? JSON.stringify(transports) : null
    const publicKeyBase64 = arrayBufferToBase64(publicKey)

    await this.db
      .prepare(
        'INSERT INTO credentials (id, user_id, public_key, counter, transports, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(credentialId, userId, publicKeyBase64, counter, transportStr, createdAt)
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
      .prepare('UPDATE credentials SET counter = ? WHERE id = ?')
      .bind(counter, credentialId)
      .run()
  }

  // Secret operations
  async getSecretsByUser(userId: string): Promise<Secret[]> {
    const results = await this.db
      .prepare('SELECT * FROM secrets WHERE user_id = ? ORDER BY created_at DESC')
      .bind(userId)
      .all<Secret>()

    return results.results || []
  }

  async getSecret(secretId: number, userId: string): Promise<Secret | null> {
    const result = await this.db
      .prepare('SELECT * FROM secrets WHERE id = ? AND user_id = ?')
      .bind(secretId, userId)
      .first<Secret>()
    return result
  }

  async createSecret(
    userId: string,
    name: string,
    encryptedValue: string,
    iv: string
  ): Promise<Secret> {
    const now = Date.now()
    const result = await this.db
      .prepare(
        'INSERT INTO secrets (user_id, name, encrypted_value, iv, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
      )
      .bind(userId, name, encryptedValue, iv, now, now)
      .first<Secret>()

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
      .prepare(
        'UPDATE secrets SET name = ?, encrypted_value = ?, iv = ?, updated_at = ? WHERE id = ? AND user_id = ?'
      )
      .bind(updatedName, updatedValue, updatedIv, now, secretId, userId)
      .run()

    return this.getSecret(secretId, userId)
  }

  async deleteSecret(secretId: number, userId: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM secrets WHERE id = ? AND user_id = ?')
      .bind(secretId, userId)
      .run()

    return result.success
  }

  // Recovery code operations
  async createRecoveryCodes(userId: string, codeHashes: string[]): Promise<void> {
    const createdAt = Date.now()
    
    // Insert all codes in a single batch
    for (const hash of codeHashes) {
      await this.db
        .prepare(
          'INSERT INTO recovery_codes (user_id, code_hash, used, created_at) VALUES (?, ?, 0, ?)'
        )
        .bind(userId, hash, createdAt)
        .run()
    }
  }

  async getRecoveryCodesByUser(userId: string): Promise<RecoveryCode[]> {
    const results = await this.db
      .prepare('SELECT * FROM recovery_codes WHERE user_id = ? ORDER BY created_at DESC')
      .bind(userId)
      .all<RecoveryCode>()

    return results.results || []
  }

  async getUnusedRecoveryCodeByHash(userId: string, codeHash: string): Promise<RecoveryCode | null> {
    const result = await this.db
      .prepare('SELECT * FROM recovery_codes WHERE user_id = ? AND code_hash = ? AND used = 0')
      .bind(userId, codeHash)
      .first<RecoveryCode>()

    return result
  }

  async markRecoveryCodeAsUsed(codeId: number): Promise<void> {
    const usedAt = Date.now()
    await this.db
      .prepare('UPDATE recovery_codes SET used = 1, used_at = ? WHERE id = ?')
      .bind(usedAt, codeId)
      .run()
  }

  async deleteAllRecoveryCodes(userId: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM recovery_codes WHERE user_id = ?')
      .bind(userId)
      .run()
  }
}
