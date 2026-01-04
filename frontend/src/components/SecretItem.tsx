import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { TableCell, TableRow } from './ui/table'
import { cryptoService } from '../crypto'
import { api } from '../api'
import SecretKeyCell from './SecretItem/SecretKeyCell'
import SecretValueCell from './SecretItem/SecretValueCell'
import SecretItemActions from './SecretItem/SecretItemActions'

interface SecretItemProps {
  secret: {
    id: number
    name: string
    encrypted_value: string
    iv: string
    created_at: number
    updated_at: number
  }
  token: string
  onDelete: () => void
  onUpdate: () => void
}

export default function SecretItem({ secret, token, onDelete, onUpdate }: SecretItemProps) {
  const [revealed, setRevealed] = useState(false)
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const decryptSecret = useCallback(async () => {
    if (decryptedValue) {
      return decryptedValue
    }

    try {
      const value = await cryptoService.decrypt(secret.encrypted_value, secret.iv)
      setDecryptedValue(value)
      return value
    } catch (error) {
      console.error('Failed to decrypt secret:', error)
      toast.error('Decryption failed', {
        description: 'Failed to decrypt secret. Please refresh and log in again.',
      })
      throw error
    }
  }, [decryptedValue, secret.encrypted_value, secret.iv])

  const handleReveal = async () => {
    if (revealed && decryptedValue) {
      setRevealed(false)
      return
    }

    setLoading(true)
    try {
      await decryptSecret()
      setRevealed(true)
    } catch (error) {
      // Error already handled in decryptSecret
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      // Decrypt if not already decrypted
      const value = await decryptSecret()
      await navigator.clipboard.writeText(value)
      toast.success('Copied to clipboard', {
        description: 'Secret value copied.',
      })
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Copy failed', {
        description: 'Failed to copy to clipboard.',
      })
    }
  }

  const handleDelete = async () => {
    try {
      await api.deleteSecret(token, secret.id)
      toast.success('Secret deleted', {
        description: `"${secret.name}" has been removed.`,
      })
      onDelete()
    } catch (error) {
      console.error('Failed to delete secret:', error)
      toast.error('Delete failed', {
        description: 'Failed to delete secret. Please try again.',
      })
    }
  }

  return (
    <TableRow>
      <SecretKeyCell name={secret.name} createdAt={secret.created_at} />
      
      <SecretValueCell revealed={revealed} decryptedValue={decryptedValue} />
      
      <TableCell className="text-right">
        <SecretItemActions
          secret={secret}
          token={token}
          revealed={revealed}
          loading={loading}
          onReveal={handleReveal}
          onCopy={handleCopy}
          onDelete={handleDelete}
          decryptSecret={decryptSecret}
          onUpdate={onUpdate}
        />
      </TableCell>
    </TableRow>
  )
}
