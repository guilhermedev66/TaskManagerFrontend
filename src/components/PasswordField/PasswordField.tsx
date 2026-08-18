import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { FieldShell } from '../FieldShell/FieldShell'
import { cx } from '../../lib/cx'
import styles from './PasswordField.module.css'

export interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  helperText?: string
  error?: string
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, helperText, error, id, className, disabled, ...rest }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <FieldShell id={id} label={label} helperText={helperText} error={error}>
        {({ id: fieldId, describedBy, invalid }) => (
          <div
            className={cx(styles.box, className)}
            data-invalid={invalid || undefined}
            data-disabled={disabled || undefined}
          >
            <input
              ref={ref}
              id={fieldId}
              type={visible ? 'text' : 'password'}
              className={styles.input}
              disabled={disabled}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              {...rest}
            />
            <button
              type="button"
              className={styles.toggle}
              disabled={disabled}
              onClick={() => setVisible((current) => !current)}
              aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {visible ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        )}
      </FieldShell>
    )
  },
)

PasswordField.displayName = 'PasswordField'
