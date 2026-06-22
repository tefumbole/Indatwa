import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  role?: string
}

export function ProtectedRoute({ children, role = 'client' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-28">
        <Loader2 className="w-8 h-8 animate-spin text-ips-blue" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role && !user?.roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
