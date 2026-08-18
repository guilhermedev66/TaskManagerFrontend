import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/Alert/Alert'
import { Button } from '../../components/Button/Button'
import { PasswordField } from '../../components/PasswordField/PasswordField'
import { TextField } from '../../components/TextField/TextField'
import { ApiError, ConnectionError, getSafeErrorMessage } from '../../lib/api/apiErrors'
import { isValidationProblemDetails } from '../../types/problemDetails'
import { formatRateLimitMessage } from './rateLimitMessage'
import { applyServerValidationErrors } from './serverValidation'
import type { FormAlert } from './types'
import { useCountdown } from './useCountdown'
import styles from './AuthForm.module.css'

// Login só exige presença — o backend (LoginRequest) não impõe tamanho mínimo, então o
// frontend também não inventa um.
const loginSchema = z.object({
  username: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export interface LoginFormProps {
  onSuccess: () => void
  initialAlert?: FormAlert | null
}

export function LoginForm({ onSuccess, initialAlert = null }: LoginFormProps) {
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const [alert, setAlert] = useState<FormAlert | null>(initialAlert)
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | undefined>()
  const remainingSeconds = useCountdown(rateLimitSeconds)
  // Ao chegar em zero, a restrição já passou: reabilita o botão e não mostra mais o aviso —
  // calculado no render, sem efeito/setState extra (a próxima chamada de onSubmit também limpa
  // rateLimitSeconds, então isso nunca fica "preso" indefinidamente).
  const rateLimitElapsed = rateLimitSeconds !== undefined && remainingSeconds === 0
  const isRateLimited = rateLimitSeconds !== undefined && !rateLimitElapsed
  const visibleAlert = rateLimitElapsed ? null : alert

  useEffect(() => {
    // Depois de Cadastro → Login (ou qualquer chegada nesta tela), foco vai pro Usuário.
    setFocus('username')
  }, [setFocus])

  async function onSubmit(values: LoginFormValues) {
    setAlert(null)
    setRateLimitSeconds(undefined)
    try {
      await login(values.username, values.password)
      onSuccess()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Nunca revela qual credencial falhou: preserva o usuário, limpa só a senha.
        setValue('password', '')
        setFocus('password')
        setAlert({ tone: 'danger', title: 'Usuário ou senha incorretos.' })
        return
      }
      if (error instanceof ApiError && error.status === 429) {
        setAlert({
          tone: 'warning',
          title: 'Muitas tentativas de login.',
          description: formatRateLimitMessage(error.retryAfterSeconds),
        })
        setRateLimitSeconds(error.retryAfterSeconds)
        return
      }
      if (error instanceof ApiError && isValidationProblemDetails(error.problemDetails)) {
        applyServerValidationErrors(setError, error.problemDetails.errors)
        return
      }
      if (error instanceof ConnectionError) {
        setAlert({
          tone: 'danger',
          title: 'Não foi possível conectar.',
          description: 'Verifique sua internet e tente novamente.',
        })
        return
      }
      setAlert({ tone: 'danger', title: getSafeErrorMessage(error) })
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 className={styles.title}>Entrar</h1>
      {visibleAlert ? (
        <Alert
          tone={visibleAlert.tone}
          title={visibleAlert.title}
          description={
            isRateLimited ? formatRateLimitMessage(remainingSeconds) : visibleAlert.description
          }
        />
      ) : null}
      <TextField
        label="Usuário"
        placeholder="Seu usuário"
        autoComplete="username"
        error={errors.username?.message}
        disabled={isSubmitting}
        {...register('username')}
      />
      <PasswordField
        label="Senha"
        placeholder="Sua senha"
        autoComplete="current-password"
        error={errors.password?.message}
        disabled={isSubmitting}
        {...register('password')}
      />
      <Button
        type="submit"
        variant="primary"
        loading={isSubmitting}
        loadingLabel="Entrando..."
        disabled={isRateLimited}
      >
        Entrar
      </Button>
      <p className={styles.footer}>
        Não tem conta?{' '}
        <Link to="/register" className={styles.footerLink}>
          Criar conta
        </Link>
      </p>
    </form>
  )
}
