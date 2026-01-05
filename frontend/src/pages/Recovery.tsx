import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { startRegistration } from '@simplewebauthn/browser'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import RecoveryCodesDialog from '@/components/RecoveryCodesDialog'
import { api } from '../api'
import { useAuth } from '../auth'

export default function Recovery() {
  const [userId, setUserId] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[]>([])
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false)
  const [recoveryData, setRecoveryData] = useState<{
    token: string
    credentialId: string
  } | null>(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  const formatRecoveryCode = (value: string) => {
    // Remove all non-alphanumeric characters
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    // Add dashes every 4 characters
    const parts = []
    for (let i = 0; i < clean.length && i < 12; i += 4) {
      parts.push(clean.slice(i, i + 4))
    }
    
    return parts.join('-')
  }

  const handleRecoveryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRecoveryCode(e.target.value)
    setRecoveryCode(formatted)
  }

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!userId.trim()) {
      setError('Please enter your user ID')
      return
    }

    if (!recoveryCode.trim()) {
      setError('Please enter a recovery code')
      return
    }

    // Validate recovery code format (should be XXXX-XXXX-XXXX)
    const cleanCode = recoveryCode.replace(/-/g, '')
    if (cleanCode.length !== 12) {
      setError('Recovery code must be 12 characters long')
      return
    }

    setLoading(true)

    try {
      // Step 1: Start recovery process
      const options = await api.recoverStart(userId.trim(), recoveryCode) as any

      if (!options.recoveryCodeId) {
        throw new Error('Invalid recovery response')
      }

      // Step 2: Create new passkey
      const credential = await startRegistration(options)

      // Step 3: Complete recovery
      const result = await api.recoverFinish(
        userId.trim(),
        credential,
        options.recoveryCodeId
      ) as any

      if (result.success && result.token && result.credentialId && result.recoveryCodes) {
        // Store recovery data
        setRecoveryData({
          token: result.token,
          credentialId: result.credentialId,
        })
        
        // Show new recovery codes
        setNewRecoveryCodes(result.recoveryCodes)
        setShowRecoveryCodes(true)

        toast.success('Account recovered!', {
          description: 'Please save your new recovery codes.',
        })
      } else {
        setError('Recovery failed. Please try again.')
      }
    } catch (err: any) {
      console.error('Recovery error:', err)

      let errorMessage = 'Failed to recover account. Please try again.'
      let toastDescription = errorMessage

      if (err.message.includes('404')) {
        errorMessage = 'User not found. Please check your user ID.'
        toastDescription = 'This user ID does not exist.'
      } else if (err.message.includes('Invalid or already used')) {
        errorMessage = 'Invalid or already used recovery code.'
        toastDescription = 'Please check your recovery code and try again.'
      } else if (err.message.includes('Invalid recovery code format')) {
        errorMessage = 'Invalid recovery code format.'
        toastDescription = 'Recovery code must be in format: XXXX-XXXX-XXXX'
      }

      toast.error('Recovery failed', { description: toastDescription })
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRecoveryCodesConfirm = async () => {
    if (!recoveryData) return

    try {
      // Login with the new credentials
      await login(userId.trim(), recoveryData.token, recoveryData.credentialId)
      setShowRecoveryCodes(false)
      navigate('/vault')
    } catch (err) {
      console.error('Login after recovery error:', err)
      toast.error('Failed to login after recovery')
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-destructive/20 via-primary/20 to-secondary/20">
        <Card className="w-full max-w-md bg-white">
          <CardHeader className="space-y-2">
            <CardTitle className="text-4xl font-black text-center">
              Recover Account
            </CardTitle>
            <CardDescription className="text-center text-base font-semibold">
              Use your recovery code to regain access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRecover} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="userId" className="text-base">
                  Your User ID
                </Label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="e.g., alice"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={loading}
                  className="text-base"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="recoveryCode" className="text-base">
                  Recovery Code
                </Label>
                <Input
                  id="recoveryCode"
                  type="text"
                  placeholder="XXXX-XXXX-XXXX"
                  value={recoveryCode}
                  onChange={handleRecoveryCodeChange}
                  disabled={loading}
                  className="text-base font-mono"
                  maxLength={14}
                />
                <p className="text-xs text-muted-foreground">
                  Enter one of your 12-character recovery codes
                </p>
              </div>

              {error && (
                <div className="p-4 border-4 border-black bg-destructive/10 rounded-sm">
                  <p className="text-sm font-semibold text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full text-base"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Recovering Account...' : 'Recover Account'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your passkey?{' '}
                  <Link
                    to="/login"
                    className="font-bold text-foreground underline hover:text-primary"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>

            <div className="mt-8 p-4 border-4 border-black bg-secondary/10 rounded-sm">
              <p className="text-xs font-semibold mb-2">How recovery works:</p>
              <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Enter your user ID and one recovery code</li>
                <li>Create a new passkey on this device</li>
                <li>Get a new set of 12 recovery codes</li>
                <li>Your old recovery codes will be invalidated</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {showRecoveryCodes && (
        <RecoveryCodesDialog
          open={showRecoveryCodes}
          onOpenChange={setShowRecoveryCodes}
          recoveryCodes={newRecoveryCodes}
          onConfirm={handleRecoveryCodesConfirm}
          userId={userId}
        />
      )}
    </>
  )
}
