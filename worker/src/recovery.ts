// Recovery code generation and verification utilities

/**
 * Character set for recovery codes (excluding confusing characters: 0, O, I, 1, L)
 */
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * Generate a single recovery code in format: XXXX-XXXX-XXXX
 */
function generateSingleCode(): string {
  const parts: string[] = []
  
  for (let i = 0; i < 3; i++) {
    let part = ''
    for (let j = 0; j < 4; j++) {
      const randomIndex = Math.floor(Math.random() * CHARSET.length)
      part += CHARSET[randomIndex]
    }
    parts.push(part)
  }
  
  return parts.join('-')
}

/**
 * Generate multiple unique recovery codes
 * @param count Number of codes to generate (default: 12)
 */
export function generateRecoveryCodes(count: number = 12): string[] {
  const codes = new Set<string>()
  
  while (codes.size < count) {
    codes.add(generateSingleCode())
  }
  
  return Array.from(codes)
}

/**
 * Hash a recovery code using PBKDF2
 * @param code Recovery code to hash
 */
export async function hashRecoveryCode(code: string): Promise<string> {
  const encoder = new TextEncoder()
  
  // Normalize code (remove dashes and uppercase)
  const normalizedCode = code.replace(/-/g, '').toUpperCase()
  
  // Use a fixed salt for recovery codes (since codes are already random)
  const salt = encoder.encode('dssm-recovery-salt-v1')
  const codeBuffer = encoder.encode(normalizedCode)
  
  // Import code as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    codeBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  )
  
  // Derive hash using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  
  // Convert to base64 for storage
  return arrayBufferToBase64(hashBuffer)
}

/**
 * Verify a recovery code against its hash
 * @param code Recovery code to verify
 * @param hash Stored hash to compare against
 */
export async function verifyRecoveryCode(code: string, hash: string): Promise<boolean> {
  try {
    const computedHash = await hashRecoveryCode(code)
    return computedHash === hash
  } catch (error) {
    console.error('Recovery code verification error:', error)
    return false
  }
}

/**
 * Normalize a recovery code (remove dashes, uppercase)
 */
export function normalizeRecoveryCode(code: string): string {
  return code.replace(/-/g, '').toUpperCase()
}

/**
 * Validate recovery code format (XXXX-XXXX-XXXX or XXXXXXXXXXXX)
 */
export function isValidRecoveryCodeFormat(code: string): boolean {
  // Remove dashes for validation
  const normalized = code.replace(/-/g, '')
  
  // Must be exactly 12 characters
  if (normalized.length !== 12) {
    return false
  }
  
  // Must only contain valid characters
  for (const char of normalized) {
    if (!CHARSET.includes(char.toUpperCase())) {
      return false
    }
  }
  
  return true
}

// Helper function
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
