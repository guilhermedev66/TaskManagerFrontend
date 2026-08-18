import { useAuth } from '../../auth/useAuth'
import { Button } from '../../components/Button/Button'
import styles from './TasksPlaceholderPage.module.css'

export function TasksPlaceholderPage() {
  const { logout } = useAuth()

  return (
    <main className={styles.page}>
      <div className={styles.banner}>
        <h1 className="text-h1">Autenticado</h1>
        <p className="text-body">
          Sessão ativa. O painel de tarefas ainda não foi implementado — chega em uma próxima fase.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            void logout()
          }}
        >
          Sair
        </Button>
      </div>
    </main>
  )
}
