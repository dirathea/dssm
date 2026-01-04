import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { cryptoService } from './crypto'

interface AuthContextType {
  isAuthenticated: boolean
  userId: string | null
  token: string | null
  isRestoringSession: boolean
  login: (userId: string, token: string, credentialId: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isRestoringSession, setIsRestoringSession] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedUserId = localStorage.getItem('userId')
      const storedToken = localStorage.getItem('token')
      const storedCredentialId = sessionStorage.getItem('credentialId')
      
      if (storedUserId && storedToken && storedCredentialId) {
        try {
          // Re-derive encryption key from stored credentialId
          await cryptoService.deriveKeyFromCredential(storedCredentialId, storedUserId)
          
          setUserId(storedUserId)
          setToken(storedToken)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Failed to restore session:', error)
          // Clear invalid session
          localStorage.removeItem('userId')
          localStorage.removeItem('token')
          sessionStorage.removeItem('credentialId')
        }
      }
      
      setIsRestoringSession(false)
    }
    
    restoreSession()
  }, [])

  // Listen for JWT expiration events
  useEffect(() => {
    const handleAuthExpired = () => {
      logout()
    }
    
    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [])

  const login = async (userId: string, token: string, credentialId: string) => {
    // Derive encryption key from credential
    await cryptoService.deriveKeyFromCredential(credentialId, userId)

    // Store session
    localStorage.setItem('userId', userId)
    localStorage.setItem('token', token)
    sessionStorage.setItem('credentialId', credentialId)
    
    setUserId(userId)
    setToken(token)
    setIsAuthenticated(true)
    
    toast.success('Welcome back!', {
      description: 'Successfully logged in.',
    })
  }

  const logout = () => {
    // Clear session
    localStorage.removeItem('userId')
    localStorage.removeItem('token')
    sessionStorage.removeItem('credentialId')
    
    setUserId(null)
    setToken(null)
    setIsAuthenticated(false)

    // Clear encryption key
    cryptoService.clearKey()
    
    // Show toast notification
    toast.info('Session expired', {
      description: 'Please log in again to continue.',
    })
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, token, isRestoringSession, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
