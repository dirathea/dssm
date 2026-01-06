import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { startAuthentication } from '@simplewebauthn/browser'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '../api'
import { useAuth } from '../auth'

export default function Login() {
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!userId.trim()) {
      setError('Please enter your user ID')
      return
    }

    setLoading(true)

    try {
      // Step 1: Get authentication options from server
      const options = await api.loginStart(userId.trim()) as any

      // Step 2: Authenticate using passkey
      const credential = await startAuthentication(options)

      // Step 3: Send credential to server for verification
      const result = await api.loginFinish(userId.trim(), credential)

      if (result.success && result.token && result.credentialId) {
        // Login successful - derive encryption key and redirect
        await login(userId.trim(), result.token, result.credentialId)
        navigate('/vault')
      } else {
        setError('Login failed. Please try again.')
      }
    } catch (err: any) {
      console.error('Login error:', err)

      let errorMessage = 'Failed to login. Please try again.'
      let toastDescription = errorMessage
      
      if (err.message.includes('404')) {
        errorMessage = 'User not found. Please register first.'
        toastDescription = 'This user ID does not exist.'
      } else if (err.message.includes('Unauthorized') || err.message.includes('Invalid')) {
        errorMessage = 'Authentication failed. Please try again.'
        toastDescription = 'Passkey authentication was rejected.'
      } else if (err.message.includes('credentials')) {
        errorMessage = 'No credentials found for this user.'
        toastDescription = 'Please register first or use the correct user ID.'
      }

      toast.error('Login failed', { description: toastDescription })
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-secondary/20 via-primary/20 to-accent/20">
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
          <form onSubmit={handleLogin} className="space-y-6">
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
              {loading ? 'Authenticating...' : 'Sign in with Passkey'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Lost your passkey?{' '}
                <Link
                  to="/recovery"
                  className="font-bold text-destructive underline hover:text-destructive/80"
                >
                  Use recovery code
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-bold text-foreground underline hover:text-primary"
                >
                  Create one
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-8 p-4 border-4 border-black bg-primary/10 rounded-sm">
            <p className="text-xs font-semibold mb-2">Security Note:</p>
            <p className="text-xs text-muted-foreground">
              Your secrets are encrypted with a key derived from your passkey. If you lose your passkey, use one of your recovery codes to regain access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
