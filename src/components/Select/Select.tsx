import { forwardRef, type SelectHTMLAttributes } from 'react'
import { FieldShell } from '../FieldShell/FieldShell'
import { cx } from '../../lib/cx'
import styles from './Select.module.css'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  helperText?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, id, className, children, ...rest }, ref) => {
    return (
      <FieldShell id={id} label={label} helperText={helperText} error={error}>
        {({ id: fieldId, describedBy, invalid }) => (
          <select
            ref={ref}
            id={fieldId}
            className={cx(styles.select, className)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            {...rest}
          >
            {children}
          </select>
        )}
      </FieldShell>
    )
  },
)

Select.displayName = 'Select'
