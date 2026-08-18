import { forwardRef, type InputHTMLAttributes } from 'react'
import { FieldShell } from '../FieldShell/FieldShell'
import { cx } from '../../lib/cx'
import styles from './TextField.module.css'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  helperText?: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, helperText, error, id, className, ...rest }, ref) => {
    return (
      <FieldShell id={id} label={label} helperText={helperText} error={error}>
        {({ id: fieldId, describedBy, invalid }) => (
          <input
            ref={ref}
            id={fieldId}
            className={cx(styles.input, className)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            {...rest}
          />
        )}
      </FieldShell>
    )
  },
)

TextField.displayName = 'TextField'
