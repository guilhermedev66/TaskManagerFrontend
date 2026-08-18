import { cx } from '../../../lib/cx'
import type { TaskStatusFilter } from '../../../types/tasks'
import styles from './StatusFilterGroup.module.css'

const OPTIONS: Array<{ value: TaskStatusFilter; label: string }> = [
  { value: 'All', label: 'Todos' },
  { value: 'Pending', label: 'Pendentes' },
  { value: 'Completed', label: 'Concluídas' },
]

export interface StatusFilterGroupProps {
  value: TaskStatusFilter
  onChange: (value: TaskStatusFilter) => void
  name?: string
  legend?: string
}

// Semântica nativa fieldset/radio: seleção comunicada pelo :checked (assistive tech), não só
// por cor — reforçada visualmente com um "✓" no rótulo selecionado.
export function StatusFilterGroup({
  value,
  onChange,
  name = 'status-filter',
  legend = 'Status',
}: StatusFilterGroupProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.pills}>
        {OPTIONS.map((option) => {
          const selected = option.value === value
          return (
            <label key={option.value} className={cx(styles.pill, selected && styles.selected)}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className={styles.radio}
              />
              {option.label}
              {selected ? <span aria-hidden="true"> ✓</span> : null}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
