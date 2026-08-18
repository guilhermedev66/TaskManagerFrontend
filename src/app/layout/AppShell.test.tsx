import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, delay } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../../auth/AuthProvider'
import { useAuth } from '../../auth/useAuth'
import { server } from '../../test/server'
import { AppShell } from './AppShell'

const BASE_URL = 'http://localhost:5078'

// Loga de verdade através do contexto real (sem mock/spy) — o mesmo caminho usado em produção,
// necessário pra que logout() tenha um refresh token guardado e realmente chame /api/logout.
function LoginTrigger() {
  const { login } = useAuth()
  return (
    <button type="button" onClick={() => void login('guilherme', 'segredo123')}>
      Entrar de teste
    </button>
  )
}

function renderShell() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/tasks']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/tasks" element={<div>Conteúdo da rota</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('AppShell', () => {
  it('renders a single navigation landmark, the main landmark, and the routed content', () => {
    renderShell()

    expect(screen.getAllByRole('navigation')).toHaveLength(1)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo da rota')).toBeInTheDocument()
  })

  it('has a Sair control with an accessible name', () => {
    renderShell()

    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('calls logout exactly once per click and ignores a rapid duplicate click while pending', async () => {
    let logoutCalls = 0
    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-token', refreshToken: 'refresh-token' }),
      ),
      http.post(`${BASE_URL}/api/logout`, async () => {
        logoutCalls += 1
        await delay(30)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/tasks']}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/tasks" element={<LoginTrigger />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Entrar de teste' }))

    const sair = screen.getByRole('button', { name: 'Sair' })
    await user.click(sair)
    // Segundo clique disparado enquanto o primeiro logout ainda está pendente (30ms de delay).
    await user.click(sair)

    await screen.findByRole('button', { name: 'Sair' })
    expect(logoutCalls).toBe(1)
  })

  it('finishes the loading state and keeps the Sair label after logout resolves', async () => {
    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-token', refreshToken: 'refresh-token' }),
      ),
      http.post(`${BASE_URL}/api/logout`, () => new HttpResponse(null, { status: 204 })),
    )

    const user = userEvent.setup()
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/tasks']}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/tasks" element={<LoginTrigger />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Entrar de teste' }))
    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('button', { name: 'Sair' })).not.toBeDisabled()
  })

  // Este teste prova só que o botão volta a ficar clicável depois que a chamada em si termina
  // (com erro) — não prova encerramento de sessão real (status/redirect). Essa prova mais forte
  // está em App.test.tsx, com ProtectedRoute de verdade.
  it('re-enables the Sair button after the request settles, even when the server call fails', async () => {
    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-token', refreshToken: 'refresh-token' }),
      ),
      http.post(`${BASE_URL}/api/logout`, () => HttpResponse.error()),
    )

    const user = userEvent.setup()
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/tasks']}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/tasks" element={<LoginTrigger />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Entrar de teste' }))
    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('button', { name: 'Sair' })).not.toBeDisabled()
  })
})
