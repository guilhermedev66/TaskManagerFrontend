import styles from './FullScreenMessage.module.css'

// Feedback visível e acessível durante a checagem inicial de sessão — nunca `null`/tela branca.
export function CheckingScreen() {
  return (
    <div className={styles.page} role="status" aria-live="polite">
      <p className="text-body">Carregando sessão...</p>
    </div>
  )
}
