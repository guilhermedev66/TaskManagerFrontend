import styles from './ActiveFilterChip.module.css'

export interface ActiveFilterChipProps {
  label: string
  onRemove: () => void
}

export function ActiveFilterChip({ label, onRemove }: ActiveFilterChipProps) {
  return (
    <span className={styles.chip}>
      {label}
      <button
        type="button"
        className={styles.remove}
        aria-label={`Remover filtro ${label}`}
        onClick={onRemove}
      >
        ×
      </button>
    </span>
  )
}
