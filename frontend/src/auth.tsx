import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { cryptoService } from './crypto'

interface AuthContextType {
  isAuthenticated: boolean
  userId: string | null
  token: string | null
  login: (userId: string, token: string, credentialId: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Try to restore session from localStorage
    const storedUserId = localStorage.getItem('userId')
    const storedToken = localStorage.getItem('token')

    if (storedUserId && storedToken) {
      setUserId(storedUserId)
      setToken(storedToken)
      setIsAuthenticated(true)
    }
  }, [])

  const login = async (userId: string, token: string, credentialId: string) => {
    // Derive encryption key from credential
    await cryptoService.deriveKeyFromCredential(credentialId, userId)

    // Store session
    localStorage.setItem('userId', userId)
    localStorage.setItem('token', token)
    setUserId(userId)
    setToken(token)
    setIsAuthenticated(true)
  }

  const logout = () => {
    // Clear session
    localStorage.removeItem('userId')
    localStorage.removeItem('token')
    setUserId(null)
    setToken(null)
    setIsAuthenticated(false)

    // Clear encryption key
    cryptoService.clearKey()
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, token, login, logout }}>
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
