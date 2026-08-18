import { cx } from '../../../lib/cx'
import styles from './StatusBadge.module.css'

export function StatusBadge({ isCompleted }: { isCompleted: boolean }) {
  return (
    <span className={cx(styles.badge, isCompleted ? styles.completed : styles.pending)}>
      {isCompleted ? 'Concluída' : 'Pendente'}
    </span>
  )
}
