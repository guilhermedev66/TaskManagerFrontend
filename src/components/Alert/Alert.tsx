import { cx } from '../../lib/cx'
import styles from './Alert.module.css'

export type AlertTone = 'danger' | 'warning' | 'success'

export interface AlertProps {
  tone: AlertTone
  title: string
  description?: string
}

const toneClass: Record<AlertTone, string> = {
  danger: styles.danger,
  warning: styles.warning,
  success: styles.success,
}

// danger/warning pedem atenção imediata (role="alert", assertivo); success é só confirmação,
// não interrompe quem usa leitor de tela (role="status", polido).
const toneRole: Record<AlertTone, 'alert' | 'status'> = {
  danger: 'alert',
  warning: 'alert',
  success: 'status',
}

export function Alert({ tone, title, description }: AlertProps) {
  return (
    <div className={cx(styles.alert, toneClass[tone])} role={toneRole[tone]}>
      <span className={styles.bar} aria-hidden="true" />
      <div className={styles.text}>
        <p className={styles.title}>{title}</p>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
    </div>
  )
}
