import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import SecretItem from '@/components/SecretItem'
import SecretForm from '@/components/SecretForm'
import { useAuth } from '../auth'
import { api } from '../api'

interface Secret {
  id: number
  name: string
  encrypted_value: string
  iv: string
  created_at: number
  updated_at: number
}

export default function Vault() {
  const { userId, token, logout } = useAuth()
  const navigate = useNavigate()
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSecrets = async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const response = await api.getSecrets(token) as any
      setSecrets(response.secrets || [])
    } catch (err: any) {
      console.error('Failed to fetch secrets:', err)
      setError('Failed to load secrets. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSecrets()
  }, [token])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-primary/20 to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black mb-2">Your Vault</h1>
            <p className="text-lg font-semibold text-muted-foreground">
              Welcome back, {userId}!
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Add Secret Button */}
        <div className="mb-6">
          <SecretForm
            trigger={
              <Button size="lg" className="w-full sm:w-auto">
                <Plus className="mr-2 h-5 w-5" />
                Add New Secret
              </Button>
            }
            onSuccess={fetchSecrets}
            token={token!}
          />
        </div>

        {/* Secrets List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block p-8 border-4 border-black bg-white rounded-sm shadow-brutal">
              <p className="text-lg font-bold">Loading your secrets...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 border-4 border-black bg-destructive/10 rounded-sm shadow-brutal">
            <p className="text-lg font-semibold text-destructive">{error}</p>
          </div>
        ) : secrets.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-8 border-4 border-black bg-white rounded-sm shadow-brutal">
              <h3 className="text-2xl font-bold mb-2">No secrets yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first secret
              </p>
              <SecretForm
                trigger={
                  <Button size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Add Your First Secret
                  </Button>
                }
                onSuccess={fetchSecrets}
                token={token!}
              />
            </div>
          </div>
        ) : (
          <div className="border-4 border-black rounded-sm shadow-brutal bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-base">Key</TableHead>
                  <TableHead className="font-bold text-base w-[120px] md:w-auto">Value</TableHead>
                  <TableHead className="text-right font-bold text-base w-[60px] md:w-auto">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {secrets.map((secret) => (
                  <SecretItem
                    key={secret.id}
                    secret={secret}
                    token={token!}
                    onDelete={fetchSecrets}
                    onUpdate={fetchSecrets}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 p-6 border-4 border-black bg-white rounded-sm shadow-brutal">
          <h3 className="font-bold mb-2">Security Notice</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>All secrets are encrypted client-side before being sent to the server</li>
            <li>The server cannot decrypt your secrets</li>
            <li>If you lose your passkey, your secrets cannot be recovered</li>
            <li>Your encryption key is stored in memory and cleared when you close the tab</li>
            <li>Sessions expire after 48 hours for security</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
