import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import RecoveryCodesDialog from '@/components/RecoveryCodesDialog'
import { api } from '../api'
import { useAuth } from '../auth'

export default function Register() {
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false)
  const [loginData, setLoginData] = useState<{
    token: string
    credentialId: string
  } | null>(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!userId.trim()) {
      setError('Please enter a user ID')
      return
    }

    setLoading(true)

    try {
      // Step 1: Get registration options from server
      const options = await api.registerStart(userId.trim()) as any

      // Step 2: Create passkey using WebAuthn
      const credential = await startRegistration(options)

      // Step 3: Send credential to server for verification
      const result = await api.registerFinish(userId.trim(), credential) as any

      if (result.success && result.credentialId && result.recoveryCodes) {
        // Store recovery codes
        setRecoveryCodes(result.recoveryCodes)
        
        // Auto-login after registration to get JWT token
        const loginOptions = await api.loginStart(userId.trim()) as any
        const loginCredential = await startAuthentication(loginOptions)
        const loginResult = await api.loginFinish(userId.trim(), loginCredential)

        // Store login data for later
        setLoginData({
          token: loginResult.token,
          credentialId: loginResult.credentialId,
        })

        // Show recovery codes dialog
        setShowRecoveryCodes(true)
        
        toast.success('Account created!', {
          description: 'Please save your recovery codes.',
        })
      } else {
        const errorMsg = 'Registration failed. Please try again.'
        toast.error('Registration failed', { description: errorMsg })
        setError(errorMsg)
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      const errorMsg = err.message || 'Failed to register. Please try again.'
      toast.error('Registration failed', { description: errorMsg })
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleRecoveryCodesConfirm = async () => {
    if (!loginData) return

    try {
      // Complete login
      await login(userId.trim(), loginData.token, loginData.credentialId)
      setShowRecoveryCodes(false)
      navigate('/vault')
    } catch (err) {
      console.error('Login after registration error:', err)
      toast.error('Failed to complete registration')
    }
  }

  return (
    <>
      <div className="min-h-[calc(100vh-60px)] md:min-h-[calc(100vh-80px)] flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="space-y-2">
          <CardTitle className="text-4xl font-black text-center">
            TapLock
          </CardTitle>
          <CardDescription className="text-center text-base font-semibold">
            Tap to Unlock Your Secrets
          </CardDescription>
          <p className="text-center text-sm text-muted-foreground">
            No passwords. Just tap your fingerprint or face ID.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="userId" className="text-base">
                Choose your User ID
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
              <p className="text-xs text-muted-foreground">
                This will be your unique identifier. Choose wisely!
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
              {loading ? 'Creating Passkey...' : 'Create Account with Passkey'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold text-foreground underline hover:text-primary"
                >
                  Sign in
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                How secure are passkeys?{' '}
                <Link
                  to="/faq"
                  className="font-bold text-foreground underline hover:text-primary"
                >
                  Read our FAQ
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-8 p-4 border-4 border-black bg-secondary/10 rounded-sm">
            <p className="text-xs font-semibold mb-2">How it works:</p>
            <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Choose a unique user ID</li>
              <li>
                <strong className="text-destructive">Create a passkey - this is the ONLY way to access your secrets!</strong>
                <br />
                <span className="ml-4">Always keep your physical passkey, or use Google/Apple password managers to sync passkeys across devices.</span>
              </li>
              <li>Start storing your secrets securely</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>

    {showRecoveryCodes && (
      <RecoveryCodesDialog
        open={showRecoveryCodes}
        onOpenChange={setShowRecoveryCodes}
        recoveryCodes={recoveryCodes}
        onConfirm={handleRecoveryCodesConfirm}
        userId={userId}
      />
    )}
  </>
  )
}
