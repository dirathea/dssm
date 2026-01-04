import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '../api'
import { useAuth } from '../auth'

export default function Register() {
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

      if (result.success && result.credentialId) {
        // Auto-login after registration
        // We need to login to get a JWT token
        const loginOptions = await api.loginStart(userId.trim()) as any
        const loginCredential = await startAuthentication(loginOptions)
        const loginResult = await api.loginFinish(userId.trim(), loginCredential)

        await login(userId.trim(), loginResult.token, loginResult.credentialId)
        toast.success('Account created!', {
          description: 'Welcome to DSSM. Your secrets are safe with us.',
        })
        navigate('/vault')
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="space-y-2">
          <CardTitle className="text-4xl font-black text-center">
            DSSM
          </CardTitle>
          <CardDescription className="text-center text-base font-semibold">
            Dead Simple Secret Manager
          </CardDescription>
          <p className="text-center text-sm text-muted-foreground">
            Create an account with just your ID and passkey
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

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
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
            <p className="text-xs font-semibold mb-2">How it works:</p>
            <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Choose a unique user ID</li>
              <li>Create a passkey using your biometrics or device PIN</li>
              <li>Start storing your secrets securely</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
