// JWT utilities for Workers using Web Crypto API

export interface JWTPayload {
  userId: string
  iat: number
  exp: number
}

export async function createJWT(userId: string, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload: JWTPayload = {
    userId,
    iat: now,
    exp: now + 48 * 60 * 60, // 48 hours
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signatureInput = `${encodedHeader}.${encodedPayload}`

  const signature = await sign(signatureInput, secret)
  return `${signatureInput}.${signature}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, signature] = parts
    const signatureInput = `${encodedHeader}.${encodedPayload}`

    // Verify signature
    const expectedSignature = await sign(signatureInput, secret)
    if (signature !== expectedSignature) return null

    // Decode and validate payload
    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload))

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null

    return payload
  } catch {
    return null
  }
}

async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const secretData = encoder.encode(secret)
  const key = await crypto.subtle.importKey(
    'raw',
    secretData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const dataBuffer = encoder.encode(data)
  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer)

  return base64UrlEncode(signature)
}

function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string

  if (typeof data === 'string') {
    base64 = btoa(data)
  } else {
    const bytes = new Uint8Array(data)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    base64 = btoa(binary)
  }

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64UrlDecode(data: string): string {
  let base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad) {
    if (pad === 1) {
      throw new Error('Invalid base64 string')
    }
    base64 += new Array(5 - pad).join('=')
  }
  return atob(base64)
}
