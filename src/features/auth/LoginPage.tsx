import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isSafeInternalPath } from '../../app/routes/internalPath'
import { AuthLayout } from './AuthLayout'
import { LoginForm } from './LoginForm'
import type { FormAlert } from './types'

interface LoginLocationState {
  from?: unknown
  authNotice?: FormAlert
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LoginLocationState

  // Consome o authNotice uma única vez: substitui a entrada de histórico sem ele (preservando
  // "from") — assim um refresh ou "voltar" do navegador não reexibe um aviso antigo. Estado (não
  // ref) porque o valor é lido durante a renderização — refs não são pra isso.
  const [initialAlert] = useState<FormAlert | null>(() => state.authNotice ?? null)
  useEffect(() => {
    if (state.authNotice) {
      navigate(location.pathname, { replace: true, state: { from: state.from } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const from = isSafeInternalPath(state.from) ? state.from : '/tasks'

  return (
    <AuthLayout>
      <LoginForm initialAlert={initialAlert} onSuccess={() => navigate(from, { replace: true })} />
    </AuthLayout>
  )
}
