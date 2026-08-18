import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { server } from '../test/server'
import App from './App'

const BASE_URL = 'http://localhost:5078'

function emptyTasksHandler() {
  return http.get(`${BASE_URL}/api/tasks`, () =>
    HttpResponse.json({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 }),
  )
}

function renderAppAt(path: string) {
  window.history.pushState({}, '', path)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  it('shows the Login screen at /login when there is no active session', async () => {
    renderAppAt('/login')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('redirects an unknown route to /login when there is no session (safe fallback)', async () => {
    renderAppAt('/rota-desconhecida')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('completes Cadastro → Login (with a one-time success alert) → /tasks → Logout', async () => {
    server.use(
      http.post(`${BASE_URL}/api/register`, () =>
        HttpResponse.json({ message: 'Usuário registrado com sucesso.' }),
      ),
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-token', refreshToken: 'refresh-token' }),
      ),
      http.post(`${BASE_URL}/api/logout`, () => new HttpResponse(null, { status: 204 })),
      emptyTasksHandler(),
    )

    const user = userEvent.setup()
    renderAppAt('/register')

    await screen.findByRole('heading', { name: 'Criar conta' })
    await user.type(screen.getByLabelText('Usuário'), 'guilherme')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByText('Cadastro realizado com sucesso.')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuário')).toHaveFocus()

    await user.type(screen.getByLabelText('Usuário'), 'guilherme')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Minhas tarefas' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    // O sucesso do cadastro já foi consumido — não deve "vazar" de volta numa navegação futura.
    expect(screen.queryByText('Cadastro realizado com sucesso.')).not.toBeInTheDocument()
  })

  it('blocks an authenticated user from reaching /login or /register directly', async () => {
    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-token', refreshToken: 'refresh-token' }),
      ),
      // A segunda árvore (abaixo) faz um bootstrap de verdade a partir do refresh token
      // persistido em sessionStorage — precisa de um handler próprio.
      http.post(`${BASE_URL}/api/refresh`, () =>
        HttpResponse.json({ token: 'access-token-2', refreshToken: 'refresh-token-2' }),
      ),
      emptyTasksHandler(),
    )
    const user = userEvent.setup()
    const firstRender = renderAppAt('/login')

    await screen.findByRole('heading', { name: 'Entrar' })
    await user.type(screen.getByLabelText('Usuário'), 'guilherme')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await screen.findByRole('heading', { name: 'Minhas tarefas' })
    firstRender.unmount()

    // Simula o usuário navegando manualmente pra /register enquanto já tem sessão ativa
    // (refresh token persistido em sessionStorage) — uma nova árvore/AuthProvider precisa
    // restaurar a sessão e ainda assim barrar /register.
    window.history.pushState({}, '', '/register')
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Minhas tarefas' })).toBeInTheDocument()
  })

  it('ends the session locally and redirects to Login when the logout endpoint fails by connection', async () => {
    let logoutCalls = 0
    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-token', refreshToken: 'refresh-token' }),
      ),
      http.post(`${BASE_URL}/api/logout`, () => {
        logoutCalls += 1
        return HttpResponse.error()
      }),
      emptyTasksHandler(),
    )

    const user = userEvent.setup()
    renderAppAt('/login')

    await screen.findByRole('heading', { name: 'Entrar' })
    await user.type(screen.getByLabelText('Usuário'), 'guilherme')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Minhas tarefas' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sair' }))

    // ProtectedRoute só mostra o Login de novo se o status realmente virou anonymous — não é só
    // o botão Sair sumindo, é a rota protegida reagindo à sessão local encerrada de verdade.
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(logoutCalls).toBe(1)
  })
})
