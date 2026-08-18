import { cx } from '../../../lib/cx'
import type { TaskItem as TaskItemType } from '../../../types/tasks'
import { formatDueDate, isTaskOverdue } from '../dates/formatDate'
import { PriorityBadge } from './PriorityBadge'
import { StatusBadge } from './StatusBadge'
import styles from './TaskItem.module.css'

export interface TaskItemProps {
  task: TaskItemType
  onToggleComplete: (task: TaskItemType) => void
  onEdit: (task: TaskItemType) => void
  onDelete: (task: TaskItemType) => void
  isToggling?: boolean
  isDeleting?: boolean
  errorMessage?: string
}

// Controles são irmãos do conteúdo, nunca a linha inteira clicável — cada ação (checkbox,
// Editar, Excluir) tem foco e nome acessível próprios, incluindo o título completo mesmo
// quando ele está visualmente truncado no desktop.
export function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  isToggling = false,
  isDeleting = false,
  errorMessage,
}: TaskItemProps) {
  const overdue = isTaskOverdue(task.dueDate, task.isCompleted)
  const busy = isToggling || isDeleting

  return (
    <li className={styles.row}>
      <div className={styles.titleLine}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={task.isCompleted}
          disabled={busy}
          onChange={() => onToggleComplete(task)}
          aria-label={
            task.isCompleted
              ? `Marcar "${task.title}" como pendente`
              : `Marcar "${task.title}" como concluída`
          }
        />
        <span className={styles.titleWrap} tabIndex={0} aria-label={task.title}>
          <span className={cx(styles.title, task.isCompleted && styles.titleCompleted)}>
            {task.title}
          </span>
          <span role="tooltip" aria-hidden="true" className={styles.tooltip}>
            {task.title}
          </span>
        </span>
      </div>
      <span className={styles.leader} aria-hidden="true" />
      <span className={styles.meta}>
        <PriorityBadge priority={task.priority} />
        <StatusBadge isCompleted={task.isCompleted} />
        <span className={cx(styles.dueDate, overdue && styles.overdue)}>
          {formatDueDate(task.dueDate)}
          {overdue ? <span className={styles.overdueLabel}> · Atrasada</span> : null}
        </span>
      </span>
      <span className={styles.actions}>
        <button
          type="button"
          className={styles.actionButton}
          disabled={busy}
          onClick={() => onEdit(task)}
          aria-label={`Editar "${task.title}"`}
        >
          Editar
        </button>
        <button
          type="button"
          className={cx(styles.actionButton, styles.dangerAction)}
          disabled={busy}
          onClick={() => onDelete(task)}
          aria-label={`Excluir "${task.title}"`}
        >
          Excluir
        </button>
      </span>
      {errorMessage ? (
        <p role="alert" className={styles.rowError}>
          {errorMessage}
        </p>
      ) : null}
    </li>
  )
}
