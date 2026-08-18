import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'danger-solid' | 'danger-ghost'

const variantClass: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  'danger-solid': styles.dangerSolid,
  'danger-ghost': styles.dangerGhost,
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant
  loading?: boolean
  /** Nome acessível durante o loading (ex.: "Entrando", "Criando tarefa"). Sem isso, cai no genérico "Carregando". */
  loadingLabel?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, loading = false, loadingLabel, disabled, className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type={rest.type ?? 'button'}
        className={cx(styles.button, variantClass[variant], className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-label={loading ? (loadingLabel ?? 'Carregando') : undefined}
        {...rest}
      >
        <span className={loading ? styles.hiddenLabel : undefined}>{children}</span>
        {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      </button>
    )
  },
)

Button.displayName = 'Button'
