import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { FieldShell } from '../FieldShell/FieldShell'
import { cx } from '../../lib/cx'
import styles from './Textarea.module.css'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  helperText?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, id, className, ...rest }, ref) => {
    return (
      <FieldShell id={id} label={label} helperText={helperText} error={error}>
        {({ id: fieldId, describedBy, invalid }) => (
          <textarea
            ref={ref}
            id={fieldId}
            className={cx(styles.textarea, className)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            {...rest}
          />
        )}
      </FieldShell>
    )
  },
)

Textarea.displayName = 'Textarea'
