import { Context } from 'hono'
import { SecretRepository } from '../repositories'

export async function listSecrets(c: Context) {
  try {
    const userId = c.get('userId') as string
    const secretRepo = c.get('secretRepo') as SecretRepository

    const secrets = await secretRepo.getSecretsByUser(userId)

    return c.json({ secrets })
  } catch (error) {
    console.error('List secrets error:', error)
    return c.json({ error: 'Failed to list secrets' }, 500)
  }
}

export async function createSecret(c: Context) {
  try {
    const userId = c.get('userId') as string
    const secretRepo = c.get('secretRepo') as SecretRepository
    const { name, encryptedValue, iv } = await c.req.json()

    if (!name || !encryptedValue || !iv) {
      return c.json({ error: 'Missing required fields: name, encryptedValue, iv' }, 400)
    }

    const secret = await secretRepo.createSecret(userId, name, encryptedValue, iv)

    return c.json({ secret }, 201)
  } catch (error) {
    console.error('Create secret error:', error)
    return c.json({ error: 'Failed to create secret' }, 500)
  }
}

export async function updateSecret(c: Context) {
  try {
    const userId = c.get('userId') as string
    const secretRepo = c.get('secretRepo') as SecretRepository
    const secretId = parseInt(c.req.param('id'))
    const { name, encryptedValue, iv } = await c.req.json()

    if (isNaN(secretId)) {
      return c.json({ error: 'Invalid secret ID' }, 400)
    }

    const secret = await secretRepo.updateSecret(secretId, userId, name, encryptedValue, iv)

    if (!secret) {
      return c.json({ error: 'Secret not found' }, 404)
    }

    return c.json({ secret })
  } catch (error) {
    console.error('Update secret error:', error)
    return c.json({ error: 'Failed to update secret' }, 500)
  }
}

export async function deleteSecret(c: Context) {
  try {
    const userId = c.get('userId') as string
    const secretRepo = c.get('secretRepo') as SecretRepository
    const secretId = parseInt(c.req.param('id'))

    if (isNaN(secretId)) {
      return c.json({ error: 'Invalid secret ID' }, 400)
    }

    const success = await secretRepo.deleteSecret(secretId, userId)

    if (!success) {
      return c.json({ error: 'Secret not found' }, 404)
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Delete secret error:', error)
    return c.json({ error: 'Failed to delete secret' }, 500)
  }
}
