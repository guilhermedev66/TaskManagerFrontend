import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
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

// Mesmos limites do RegisterRequest do backend (Username MinLength 3/MaxLength 50, Password
// MinLength 6/MaxLength 100) — feedback instantâneo sem round-trip, nunca mais rígido nem mais
// frouxo do que o servidor já exige.
const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Usuário deve ter pelo menos 3 caracteres')
    .max(50, 'Usuário deve ter no máximo 50 caracteres'),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export interface RegisterFormProps {
  onRegistered: () => void
}

export function RegisterForm({ onRegistered }: RegisterFormProps) {
  const { register: registerAccount } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', password: '' },
  })

  const [alert, setAlert] = useState<FormAlert | null>(null)
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | undefined>()
  const remainingSeconds = useCountdown(rateLimitSeconds)
  // Ao chegar em zero, a restrição já passou: reabilita o botão e não mostra mais o aviso —
  // calculado no render, sem efeito/setState extra (a próxima chamada de onSubmit também limpa
  // rateLimitSeconds, então isso nunca fica "preso" indefinidamente).
  const rateLimitElapsed = rateLimitSeconds !== undefined && remainingSeconds === 0
  const isRateLimited = rateLimitSeconds !== undefined && !rateLimitElapsed
  const visibleAlert = rateLimitElapsed ? null : alert

  async function onSubmit(values: RegisterFormValues) {
    setAlert(null)
    setRateLimitSeconds(undefined)
    try {
      await registerAccount(values.username, values.password)
      onRegistered()
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setAlert({
          tone: 'danger',
          title: 'Esse nome de usuário já está em uso.',
          description: 'Tente outro nome de usuário.',
        })
        return
      }
      if (error instanceof ApiError && error.status === 429) {
        setAlert({
          tone: 'warning',
          title: 'Muitas tentativas de cadastro.',
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
      <h1 className={styles.title}>Criar conta</h1>
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
        placeholder="Escolha um usuário"
        autoComplete="username"
        error={errors.username?.message}
        disabled={isSubmitting}
        {...register('username')}
      />
      <PasswordField
        label="Senha"
        placeholder="Crie uma senha"
        autoComplete="new-password"
        helperText="Mínimo de 6 caracteres."
        error={errors.password?.message}
        disabled={isSubmitting}
        {...register('password')}
      />
      <Button
        type="submit"
        variant="primary"
        loading={isSubmitting}
        loadingLabel="Criando conta..."
        disabled={isRateLimited}
      >
        Criar conta
      </Button>
      <p className={styles.footer}>
        Já tem conta?{' '}
        <Link to="/login" className={styles.footerLink}>
          Entrar
        </Link>
      </p>
    </form>
  )
}
