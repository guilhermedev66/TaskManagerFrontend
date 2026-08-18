import { useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { RegisterForm } from './RegisterForm'
import type { FormAlert } from './types'

const REGISTER_SUCCESS_ALERT: FormAlert = {
  tone: 'success',
  title: 'Cadastro realizado com sucesso.',
  description: 'Faça login para continuar.',
}

export function RegisterPage() {
  const navigate = useNavigate()

  return (
    <AuthLayout>
      <RegisterForm
        onRegistered={() =>
          navigate('/login', { replace: true, state: { authNotice: REGISTER_SUCCESS_ALERT } })
        }
      />
    </AuthLayout>
  )
}
