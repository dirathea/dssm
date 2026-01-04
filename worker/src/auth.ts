import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server/script/deps'
import type { Database, Credential } from './db'

// In-memory challenge store (in production, use KV or Durable Objects)
const challenges = new Map<string, string>()

export interface WebAuthnConfig {
  rpName: string
  rpID: string
  origin: string
}

export class WebAuthnService {
  constructor(
    private db: Database,
    private config: WebAuthnConfig
  ) {}

  async generateRegistrationOptions(
    userId: string
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    // Ensure user exists
    let user = await this.db.getUser(userId)
    if (!user) {
      user = await this.db.createUser(userId)
    }

    // Get existing credentials for this user
    const existingCredentials = await this.db.getCredentialsByUser(userId)

    const options = await generateRegistrationOptions({
      rpName: this.config.rpName,
      rpID: this.config.rpID,
      userName: userId,
      userDisplayName: userId,
      attestationType: 'none',
      excludeCredentials: existingCredentials.map((cred) => ({
        id: cred.id,
        type: 'public-key' as const,
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    })

    // Store challenge
    challenges.set(userId, options.challenge)

    return options
  }

  async verifyRegistration(
    userId: string,
    response: RegistrationResponseJSON
  ): Promise<{ verified: boolean; credentialId?: string }> {
    const expectedChallenge = challenges.get(userId)
    if (!expectedChallenge) {
      return { verified: false }
    }

    try {
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.config.origin,
        expectedRPID: this.config.rpID,
        requireUserVerification: false,
      })

      if (!verification.verified || !verification.registrationInfo) {
        return { verified: false }
      }

      const { credentialPublicKey, credentialID, counter } = verification.registrationInfo

      // Store credential in database
      const transports = response.response.transports
      await this.db.createCredential(
        credentialID.toString(),
        userId,
        credentialPublicKey,
        counter,
        transports
      )

      // Clean up challenge
      challenges.delete(userId)

      return { verified: true, credentialId: credentialID.toString() }
    } catch (error) {
      console.error('Registration verification error:', error)
      return { verified: false }
    }
  }

  async generateAuthenticationOptions(
    userId: string
  ): Promise<PublicKeyCredentialRequestOptionsJSON | null> {
    const user = await this.db.getUser(userId)
    if (!user) return null

    const credentials = await this.db.getCredentialsByUser(userId)
    if (credentials.length === 0) return null

    const options = await generateAuthenticationOptions({
      rpID: this.config.rpID,
      allowCredentials: credentials.map((cred) => ({
        id: cred.id,
        type: 'public-key' as const,
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
      })),
      userVerification: 'preferred',
    })

    // Store challenge
    challenges.set(userId, options.challenge)

    return options
  }

  async verifyAuthentication(
    userId: string,
    response: AuthenticationResponseJSON
  ): Promise<{ verified: boolean; credentialId?: string }> {
    const expectedChallenge = challenges.get(userId)
    if (!expectedChallenge) {
      return { verified: false }
    }

    try {
      const credential = await this.db.getCredential(response.id)
      if (!credential || credential.user_id !== userId) {
        return { verified: false }
      }

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.config.origin,
        expectedRPID: this.config.rpID,
        authenticator: {
          credentialID: credential.id,
          credentialPublicKey: new Uint8Array(credential.public_key),
          counter: credential.counter,
        },
        requireUserVerification: false,
      })

      if (!verification.verified) {
        return { verified: false }
      }

      // Update counter
      await this.db.updateCredentialCounter(credential.id, verification.authenticationInfo.newCounter)

      // Clean up challenge
      challenges.delete(userId)

      return { verified: true, credentialId: credential.id }
    } catch (error) {
      console.error('Authentication verification error:', error)
      return { verified: false }
    }
  }
}
