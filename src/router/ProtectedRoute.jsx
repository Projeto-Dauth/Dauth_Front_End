import { Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

const DEV_BYPASS = false

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()

  if (DEV_BYPASS) return children

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/nao-autorizado" replace />
  }

  return children
}
