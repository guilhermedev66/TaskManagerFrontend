import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { CheckingScreen } from './CheckingScreen'

export function PublicOnlyRoute() {
  const { status } = useAuth()

  if (status.kind === 'checking') {
    return <CheckingScreen />
  }

  if (status.kind === 'authenticated') {
    return <Navigate to="/tasks" replace />
  }

  return <Outlet />
}
