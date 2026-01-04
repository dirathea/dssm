import { useState } from 'react'
import { Eye, EyeOff, Copy, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'
import { cryptoService } from '../crypto'
import { api } from '../api'

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
}

export default function SecretItem({ secret, token, onDelete }: SecretItemProps) {
  const [revealed, setRevealed] = useState(false)
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleReveal = async () => {
    if (revealed && decryptedValue) {
      setRevealed(false)
      return
    }

    setLoading(true)
    try {
      const value = await cryptoService.decrypt(secret.encrypted_value, secret.iv)
      setDecryptedValue(value)
      setRevealed(true)
    } catch (error) {
      console.error('Failed to decrypt secret:', error)
      alert('Failed to decrypt secret. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!decryptedValue) return

    try {
      await navigator.clipboard.writeText(decryptedValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await api.deleteSecret(token, secret.id)
      onDelete()
    } catch (error) {
      console.error('Failed to delete secret:', error)
      alert('Failed to delete secret. Please try again.')
    }
  }

  return (
    <Card className="bg-white hover:shadow-brutal-lg transition-all">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{secret.name}</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReveal}
              disabled={loading}
              title={revealed ? 'Hide' : 'Reveal'}
            >
              {revealed ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>

            {revealed && decryptedValue && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                title={copied ? 'Copied!' : 'Copy'}
              >
                <Copy className={`h-5 w-5 ${copied ? 'text-primary' : ''}`} />
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger>
                <Button variant="ghost" size="icon" title="Delete">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Secret?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{secret.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    <Button variant="outline">Cancel</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction>
                    <Button variant="destructive" onClick={handleDelete}>
                      Delete
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {revealed && decryptedValue ? (
          <div className="p-4 border-4 border-black bg-primary/5 rounded-sm font-mono text-sm break-all">
            {decryptedValue}
          </div>
        ) : (
          <div className="p-4 border-4 border-black bg-muted rounded-sm text-sm text-muted-foreground">
            •••••••••••••••••••••
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Created: {new Date(secret.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  )
}
