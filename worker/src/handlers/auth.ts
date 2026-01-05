import { Context } from 'hono'
import { WebAuthnService } from '../auth'
import { createJWT } from '../crypto'
import { Database } from '../db'
import {
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  isValidRecoveryCodeFormat,
} from '../recovery'

export async function registerStart(c: Context) {
  try {
    const { userId } = await c.req.json()

    if (!userId || typeof userId !== 'string') {
      return c.json({ error: 'Invalid userId' }, 400)
    }

    const webauthn = c.get('webauthn') as WebAuthnService
    const options = await webauthn.generateRegistrationOptions(userId)

    return c.json(options)
  } catch (error) {
    console.error('Registration start error:', error)
    return c.json({ error: 'Failed to start registration' }, 500)
  }
}

export async function registerFinish(c: Context) {
  try {
    const { userId, credential } = await c.req.json()

    if (!userId || typeof userId !== 'string' || !credential) {
      return c.json({ error: 'Invalid request' }, 400)
    }

    const webauthn = c.get('webauthn') as WebAuthnService
    const { verified, credentialId } = await webauthn.verifyRegistration(userId, credential)

    if (!verified) {
      return c.json({ error: 'Registration verification failed' }, 400)
    }

    // Generate 12 recovery codes
    const recoveryCodes = generateRecoveryCodes(12)
    
    // Hash and store recovery codes
    const db = c.get('db') as Database
    const codeHashes = await Promise.all(
      recoveryCodes.map((code) => hashRecoveryCode(code))
    )
    await db.createRecoveryCodes(userId, codeHashes)

    return c.json({ success: true, credentialId, recoveryCodes })
  } catch (error) {
    console.error('Registration finish error:', error)
    return c.json({ error: 'Failed to complete registration' }, 500)
  }
}

export async function loginStart(c: Context) {
  try {
    const { userId } = await c.req.json()

    if (!userId || typeof userId !== 'string') {
      return c.json({ error: 'Invalid userId' }, 400)
    }

    const webauthn = c.get('webauthn') as WebAuthnService
    const options = await webauthn.generateAuthenticationOptions(userId)

    if (!options) {
      return c.json({ error: 'User not found or no credentials' }, 404)
    }

    return c.json(options)
  } catch (error) {
    console.error('Login start error:', error)
    return c.json({ error: 'Failed to start login' }, 500)
  }
}

export async function loginFinish(c: Context) {
  try {
    const { userId, credential } = await c.req.json()

    if (!userId || typeof userId !== 'string' || !credential) {
      return c.json({ error: 'Invalid request' }, 400)
    }

    const webauthn = c.get('webauthn') as WebAuthnService
    const { verified, credentialId } = await webauthn.verifyAuthentication(userId, credential)

    if (!verified) {
      return c.json({ error: 'Authentication verification failed' }, 400)
    }

    // Create JWT token
    const jwtSecret = c.env.JWT_SECRET
    const token = await createJWT(userId, jwtSecret)

    // Set httpOnly cookie
    c.header(
      'Set-Cookie',
      `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
    )

    return c.json({ success: true, token, userId, credentialId })
  } catch (error) {
    console.error('Login finish error:', error)
    return c.json({ error: 'Failed to complete login' }, 500)
  }
}

export async function recoverStart(c: Context) {
  try {
    const { userId, recoveryCode } = await c.req.json()

    if (!userId || typeof userId !== 'string' || !recoveryCode || typeof recoveryCode !== 'string') {
      return c.json({ error: 'Invalid request' }, 400)
    }

    // Validate recovery code format
    if (!isValidRecoveryCodeFormat(recoveryCode)) {
      return c.json({ error: 'Invalid recovery code format' }, 400)
    }

    // Check if user exists
    const db = c.get('db') as Database
    const user = await db.getUser(userId)
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Hash the recovery code and check if it exists and is unused
    const codeHash = await hashRecoveryCode(recoveryCode)
    const storedCode = await db.getUnusedRecoveryCodeByHash(userId, codeHash)

    if (!storedCode) {
      return c.json({ error: 'Invalid or already used recovery code' }, 400)
    }

    // Generate WebAuthn registration options for new passkey
    const webauthn = c.get('webauthn') as WebAuthnService
    const options = await webauthn.generateRegistrationOptions(userId)

    // Store the recovery code ID in the response so we can mark it as used later
    return c.json({ ...options, recoveryCodeId: storedCode.id })
  } catch (error) {
    console.error('Recovery start error:', error)
    return c.json({ error: 'Failed to start recovery' }, 500)
  }
}

export async function recoverFinish(c: Context) {
  try {
    const { userId, credential, recoveryCodeId } = await c.req.json()

    if (
      !userId ||
      typeof userId !== 'string' ||
      !credential ||
      typeof recoveryCodeId !== 'number'
    ) {
      return c.json({ error: 'Invalid request' }, 400)
    }

    const db = c.get('db') as Database
    const webauthn = c.get('webauthn') as WebAuthnService

    // Verify the new passkey registration
    const { verified, credentialId } = await webauthn.verifyRegistration(userId, credential)

    if (!verified) {
      return c.json({ error: 'Registration verification failed' }, 400)
    }

    // Mark the old recovery code as used
    await db.markRecoveryCodeAsUsed(recoveryCodeId)

    // Delete all old recovery codes
    await db.deleteAllRecoveryCodes(userId)

    // Generate new set of 12 recovery codes
    const newRecoveryCodes = generateRecoveryCodes(12)
    const codeHashes = await Promise.all(
      newRecoveryCodes.map((code) => hashRecoveryCode(code))
    )
    await db.createRecoveryCodes(userId, codeHashes)

    // Create JWT token
    const jwtSecret = c.env.JWT_SECRET
    const token = await createJWT(userId, jwtSecret)

    // Set httpOnly cookie
    c.header(
      'Set-Cookie',
      `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
    )

    return c.json({
      success: true,
      token,
      userId,
      credentialId,
      recoveryCodes: newRecoveryCodes,
    })
  } catch (error) {
    console.error('Recovery finish error:', error)
    return c.json({ error: 'Failed to complete recovery' }, 500)
  }
}
