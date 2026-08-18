import styles from './TaskListSkeleton.module.css'

export interface TaskListSkeletonProps {
  rows?: number
}

// aria-hidden: é decoração de carregamento, não conteúdo — o anúncio de "carregando" real fica
// no role="status" ao lado (ver TasksDashboardPage), não aqui.
export function TaskListSkeleton({ rows = 5 }: TaskListSkeletonProps) {
  return (
    <div className={styles.list} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={styles.row}>
          <div className={styles.bar} style={{ width: '45%' }} />
          <div className={styles.bar} style={{ width: '20%' }} />
        </div>
      ))}
    </div>
  )
}
