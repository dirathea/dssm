import { useState, useEffect } from 'react'
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
  trigger?: React.ReactNode | null
  onSuccess: () => void
  token: string
  secret?: {
    id: number
    name: string
    encrypted_value: string
    iv: string
  }
  decryptSecret?: () => Promise<string>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function SecretForm({ 
  trigger, 
  onSuccess, 
  token, 
  secret, 
  decryptSecret,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange 
}: SecretFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState(secret?.name || '')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [decrypting, setDecrypting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  // Watch for controlled open state changes and decrypt when opening
  useEffect(() => {
    const decryptOnOpen = async () => {
      if (open && secret && decryptSecret) {
        setDecrypting(true)
        setError(null)
        try {
          const decryptedValue = await decryptSecret()
          setValue(decryptedValue)
        } catch (err: any) {
          console.error('Failed to decrypt secret for editing:', err)
          setError('Failed to decrypt secret. Please try again.')
        } finally {
          setDecrypting(false)
        }
      } else if (!open) {
        // Reset form when closing
        setName(secret?.name || '')
        setValue('')
        setError(null)
      }
    }

    decryptOnOpen()
  }, [open, secret, decryptSecret])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
  }

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
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

          {decrypting ? (
            <div className="my-8 text-center">
              <p className="text-sm text-muted-foreground">Decrypting secret...</p>
            </div>
          ) : (
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
                  rows={4}
                />
              </div>

              {error && (
                <div className="p-3 border-4 border-black bg-destructive/10 rounded-sm">
                  <p className="text-sm font-semibold text-destructive">{error}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="neutral"
              onClick={() => setOpen(false)}
              disabled={loading || decrypting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || decrypting}>
              {loading ? 'Saving...' : secret ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
