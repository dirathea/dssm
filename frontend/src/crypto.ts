// Client-side encryption utilities using Web Crypto API

export class CryptoService {
  private encryptionKey: CryptoKey | null = null

  /**
   * Derive encryption key from credential ID using PBKDF2
   */
  async deriveKeyFromCredential(credentialId: string, userId: string): Promise<void> {
    const encoder = new TextEncoder()

    // Use credential ID as password
    const passwordBuffer = encoder.encode(credentialId)

    // Use userId as salt
    const saltBuffer = encoder.encode(userId)

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    // Derive encryption key
    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Encrypt a secret value
   */
  async encrypt(plaintext: string): Promise<{ encryptedValue: string; iv: string }> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized. Call deriveKeyFromCredential first.')
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    // Generate random IV (12 bytes for AES-GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.encryptionKey,
      data
    )

    // Convert to base64 for storage
    const encryptedValue = arrayBufferToBase64(encrypted)
    const ivBase64 = arrayBufferToBase64(iv)

    return { encryptedValue, iv: ivBase64 }
  }

  /**
   * Decrypt a secret value
   */
  async decrypt(encryptedValue: string, iv: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized. Call deriveKeyFromCredential first.')
    }

    // Convert from base64
    const encrypted = base64ToArrayBuffer(encryptedValue)
    const ivBuffer = base64ToArrayBuffer(iv)

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      this.encryptionKey,
      encrypted
    )

    // Convert to string
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }

  /**
   * Clear the encryption key from memory
   */
  clearKey(): void {
    this.encryptionKey = null
  }

  /**
   * Check if encryption key is set
   */
  hasKey(): boolean {
    return this.encryptionKey !== null
  }
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Singleton instance
export const cryptoService = new CryptoService()
