import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './auth'
import { Toaster } from '@/components/ui/sonner'
import Register from './pages/Register'
import Login from './pages/Login'
import Recovery from './pages/Recovery'
import Vault from './pages/Vault'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isRestoringSession } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    // Listen for auth expiry and redirect
    const handleAuthExpired = () => {
      navigate('/login', { replace: true })
    }
    
    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [navigate])
  
  if (isRestoringSession) {
    // Show loading state while restoring session
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent/20 via-primary/20 to-secondary/20">
        <div className="p-8 border-4 border-black bg-white rounded-sm shadow-brutal">
          <p className="text-lg font-bold">Restoring session...</p>
        </div>
      </div>
    )
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recovery" element={<Recovery />} />
            <Route
              path="/vault"
              element={
                <ProtectedRoute>
                  <Vault />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
