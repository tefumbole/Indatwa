import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'

const ADMIN_ROLES = [
  'super_admin', 'director', 'operations_manager',
  'finance_officer', 'protocol_officer', 'customer_service',
]

export function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const isAdmin = user?.roles.some((r) => ADMIN_ROLES.includes(r))

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ips-blue" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
