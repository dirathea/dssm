import { Context } from 'hono'
import { WebAuthnService } from '../auth'
import { createJWT } from '../crypto'

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

    return c.json({ success: true, credentialId })
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
