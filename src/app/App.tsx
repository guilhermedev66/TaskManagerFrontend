import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { TasksDashboardPage } from '../features/tasks/TasksDashboardPage'
import { AppShell } from './layout/AppShell'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { PublicOnlyRoute } from './routes/PublicOnlyRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/tasks" element={<TasksDashboardPage />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        {/* Fallback seguro: qualquer rota desconhecida cai em /tasks, que por sua vez redireciona
            para /login se não houver sessão — nunca expõe um destino externo ou tela quebrada. */}
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
