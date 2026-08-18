import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { FieldError } from '../FieldError/FieldError'
import { cx } from '../../lib/cx'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, disabled, className, ...rest }, ref) => {
    const autoId = useId()
    const resolvedId = id ?? autoId
    const errorId = `${resolvedId}-error`

    return (
      <div>
        <label className={styles.row} htmlFor={resolvedId}>
          <input
            ref={ref}
            id={resolvedId}
            type="checkbox"
            className={cx(styles.input, className)}
            disabled={disabled}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={Boolean(error) || undefined}
            {...rest}
          />
          <span className={cx('text-body', disabled ? styles.labelDisabled : styles.label)}>
            {label}
          </span>
        </label>
        {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
