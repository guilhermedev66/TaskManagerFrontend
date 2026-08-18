import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

// Template único reaproveitado por todo estado que "assume a região da lista": vazio inicial,
// busca sem resultado, filtro sem resultado, falha de conexão e erro inesperado — todos têm a
// mesma anatomia (título + descrição + ação opcional), só o texto e a ação mudam.
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.card}>
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  )
}
