import type { SortDirection, TaskSortBy } from '../../../types/tasks'
import { SORT_OPTIONS, sortOptionValue } from '../sort/sortOptions'
import styles from './SortSelect.module.css'

export interface SortSelectProps {
  sortBy: TaskSortBy
  sortDirection: SortDirection
  onChange: (sortBy: TaskSortBy, sortDirection: SortDirection) => void
  id?: string
}

export function SortSelect({ sortBy, sortDirection, onChange, id = 'task-sort' }: SortSelectProps) {
  return (
    <div className={styles.wrapper}>
      <label className={styles.visuallyHidden} htmlFor={id}>
        Ordenar por
      </label>
      <select
        id={id}
        className={styles.select}
        value={sortOptionValue(sortBy, sortDirection)}
        onChange={(event) => {
          const option = SORT_OPTIONS.find((candidate) => candidate.value === event.target.value)
          if (option) onChange(option.sortBy, option.sortDirection)
        }}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
