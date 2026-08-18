import { useAuth } from '../../auth/useAuth'
import { Button } from '../../components/Button/Button'
import styles from './FullScreenMessage.module.css'

export interface SessionRecoveryScreenProps {
  reason: 'connection-error' | 'rate-limited'
}

const MESSAGES: Record<SessionRecoveryScreenProps['reason'], string> = {
  'rate-limited': 'Muitas tentativas. Aguarde alguns instantes e tente novamente.',
  'connection-error':
    'Não foi possível confirmar sua sessão. Verifique sua conexão e tente novamente.',
}

// Falha transitória (429/rede/5xx) ao restaurar a sessão: nunca tratada como sessão expirada —
// oferece uma ação explícita de retry, sem repetir automaticamente.
export function SessionRecoveryScreen({ reason }: SessionRecoveryScreenProps) {
  const { retryInitialization } = useAuth()

  return (
    <div className={styles.page} role="alert">
      <p className="text-body">{MESSAGES[reason]}</p>
      <Button variant="secondary" onClick={retryInitialization}>
        Tentar novamente
      </Button>
    </div>
  )
}
