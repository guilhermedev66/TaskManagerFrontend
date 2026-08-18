import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import type { FormAlert } from '../../features/auth/types'
import { CheckingScreen } from './CheckingScreen'
import { SessionRecoveryScreen } from './SessionRecoveryScreen'

const SESSION_EXPIRED_NOTICE: FormAlert = {
  tone: 'danger',
  title: 'Sua sessão expirou.',
  description: 'Entre novamente para continuar.',
}

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status.kind === 'checking') {
    return <CheckingScreen />
  }

  if (status.kind === 'anonymous') {
    // Falha transitória (429/conexão) não é "sessão expirada" — nunca redireciona de vez para
    // o Login por causa dela, oferece recuperação no lugar.
    if (status.reason === 'connection-error' || status.reason === 'rate-limited') {
      return <SessionRecoveryScreen reason={status.reason} />
    }

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          authNotice: status.reason === 'session-expired' ? SESSION_EXPIRED_NOTICE : undefined,
        }}
      />
    )
  }

  return <Outlet />
}
