import { cx } from '../../../lib/cx'
import type { TaskPriority } from '../../../types/tasks'
import styles from './PriorityBadge.module.css'

const PRIORITY_LABEL: Record<TaskPriority, string> = { 0: 'Baixa', 1: 'Média', 2: 'Alta' }
const PRIORITY_CLASS: Record<TaskPriority, string> = {
  0: styles.low,
  1: styles.medium,
  2: styles.high,
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cx(styles.badge, PRIORITY_CLASS[priority])}>
      <span className={styles.sign} aria-hidden="true" />
      {PRIORITY_LABEL[priority]}
    </span>
  )
}
