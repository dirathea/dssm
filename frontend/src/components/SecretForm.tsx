import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { cryptoService } from '../crypto'
import { api } from '../api'

interface SecretFormProps {
  trigger: React.ReactNode
  onSuccess: () => void
  token: string
  secret?: {
    id: number
    name: string
    encrypted_value: string
    iv: string
  }
}

export default function SecretForm({ trigger, onSuccess, token, secret }: SecretFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(secret?.name || '')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !value.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      // Encrypt the secret value
      const { encryptedValue, iv } = await cryptoService.encrypt(value)

      if (secret) {
        // Update existing secret
        await api.updateSecret(token, secret.id, {
          name: name.trim(),
          encryptedValue,
          iv,
        })
        toast.success('Secret updated', {
          description: `"${name.trim()}" has been updated.`,
        })
      } else {
        // Create new secret
        await api.createSecret(token, name.trim(), encryptedValue, iv)
        toast.success('Secret created', {
          description: `"${name.trim()}" has been added to your vault.`,
        })
      }

      // Reset form and close dialog
      setName('')
      setValue('')
      setOpen(false)
      onSuccess()
    } catch (err: any) {
      console.error('Failed to save secret:', err)
      const errorMsg = err.message || 'Failed to save secret'
      toast.error('Operation failed', { description: errorMsg })
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{secret ? 'Edit Secret' : 'Add New Secret'}</DialogTitle>
            <DialogDescription>
              {secret
                ? 'Update your secret. It will be encrypted before saving.'
                : 'Create a new secret. It will be encrypted before saving.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., GitHub Token"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Secret Value</Label>
              <Textarea
                id="value"
                placeholder="Enter your secret..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 border-4 border-black bg-destructive/10 rounded-sm">
                <p className="text-sm font-semibold text-destructive">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : secret ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
