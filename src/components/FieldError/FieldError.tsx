import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './FieldError.module.css'

export interface FieldErrorProps {
  id?: string
  children: ReactNode
}

/**
 * Texto de erro associado a um campo via aria-describedby (aplicado por quem usa este
 * componente — TextField/PasswordField/Textarea/Select via FieldShell). Não tem role
 * próprio: não é um alerta indiscriminado enquanto o usuário digita, e o anúncio após
 * submissão fica a cargo do formulário que vai integrar isso no futuro.
 */
export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <p id={id} className={cx('text-helper', styles.error)}>
      {children}
    </p>
  )
}
