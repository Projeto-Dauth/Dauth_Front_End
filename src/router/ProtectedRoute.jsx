import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

const DEV_BYPASS = false

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (DEV_BYPASS) return children

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.must_change_password && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/nao-autorizado" replace />
  }

  return children
}
