import { render, screen } from '@testing-library/react'
import { http, HttpResponse, delay } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../../auth/AuthProvider'
import { setStoredRefreshToken } from '../../auth/tokenStorage'
import { server } from '../../test/server'
import { ProtectedRoute } from './ProtectedRoute'

const BASE_URL = 'http://localhost:5078'

function renderAt(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/tasks" element={<div>Tela de tarefas</div>} />
          </Route>
          <Route path="/login" element={<div>Tela de login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  it('shows an accessible loading state while checking, never a blank screen', () => {
    // Sem token guardado, o bootstrap resolve no mesmo tick (sem `await` real) — para observar
    // "checking" de verdade precisa de uma fronteira assíncrona genuína (fetch real via MSW).
    setStoredRefreshToken('refresh-seed')
    server.use(
      http.post(`${BASE_URL}/api/refresh`, async () => {
        await delay(30)
        return HttpResponse.json({ token: 'access-1', refreshToken: 'refresh-2' })
      }),
    )

    renderAt('/tasks')

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Tela de tarefas')).not.toBeInTheDocument()
  })

  it('redirects an anonymous user from /tasks to /login', async () => {
    renderAt('/tasks')

    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
  })
})
