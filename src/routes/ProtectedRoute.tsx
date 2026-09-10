import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { RoleName } from '../constants/roles'

type ProtectedRouteProps = {
  allowedRoles: RoleName[]
}

export default function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!user.roleName || !allowedRoles.includes(user.roleName)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}