import { useId, type ReactNode } from 'react'
import { FieldError } from '../FieldError/FieldError'
import styles from './FieldShell.module.css'

export interface FieldShellRenderProps {
  id: string
  describedBy: string | undefined
  invalid: boolean
}

export interface FieldShellProps {
  id?: string
  label: string
  helperText?: string
  error?: string
  children: (props: FieldShellRenderProps) => ReactNode
}

/**
 * helperText e error são semanticamente independentes: quando os dois existem, os dois
 * ficam visíveis e os dois entram no aria-describedby (nunca um substitui o outro) — o
 * erro não apaga a orientação auxiliar que já estava lá.
 */
export function FieldShell({ id, label, helperText, error, children }: FieldShellProps) {
  const autoId = useId()
  const resolvedId = id ?? autoId
  const helperId = helperText ? `${resolvedId}-helper` : undefined
  const errorId = error ? `${resolvedId}-error` : undefined
  const invalid = Boolean(error)
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.wrapper}>
      <label className="text-label" htmlFor={resolvedId}>
        {label}
      </label>
      {children({ id: resolvedId, describedBy, invalid })}
      {helperText ? (
        <p id={helperId} className="text-helper">
          {helperText}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}
