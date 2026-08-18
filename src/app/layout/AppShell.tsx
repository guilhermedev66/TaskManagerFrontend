import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../../components/Button/Button'
import styles from './AppShell.module.css'

// Shell autenticado reutilizável (rota de layout — não conhece endpoints de tarefas nem guarda
// estado de servidor). Só renderiza a navegação + o landmark <main>; o gate de autenticação
// continua em ProtectedRoute, uma camada acima na árvore de rotas.
export function AppShell() {
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className={styles.shell}>
      <nav className={styles.nav} aria-label="Principal">
        <div className={styles.navInner}>
          <span className={styles.wordmark}>TaskManagerAPI</span>
          <Button
            variant="secondary"
            className={styles.logoutButton}
            loading={isLoggingOut}
            loadingLabel="Saindo..."
            onClick={() => {
              void handleLogout()
            }}
          >
            Sair
          </Button>
        </div>
      </nav>
      <main className={styles.main}>
        <div className={styles.mainInner}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
