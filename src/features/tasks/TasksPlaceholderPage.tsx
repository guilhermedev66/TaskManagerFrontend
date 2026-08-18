import styles from './TasksPlaceholderPage.module.css'

// O landmark <main> já vem do AppShell — esta página só entrega o conteúdo da rota.
export function TasksPlaceholderPage() {
  return (
    <div className={styles.page}>
      <h1 className="text-h1">Tarefas</h1>
      <p className="text-body">
        O painel de tarefas será construído em uma próxima fase. Por enquanto, esta tela só confirma
        que a sessão está ativa dentro do shell autenticado.
      </p>
    </div>
  )
}
