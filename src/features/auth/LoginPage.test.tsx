import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../../auth/AuthProvider'
import { server } from '../../test/server'
import { LoginPage } from './LoginPage'

const BASE_URL = 'http://localhost:5078'

function renderAt(initialEntries: Array<{ pathname: string; state?: unknown }>) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tasks" element={<div>Destino padrão</div>} />
          <Route path="/relatorios" element={<div>Destino pretendido</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

async function login(user: ReturnType<typeof userEvent.setup>) {
  server.use(
    http.post(`${BASE_URL}/api/login`, () =>
      HttpResponse.json({ token: 'access-token', refreshToken: 'refresh-token' }),
    ),
  )
  await user.type(screen.getByLabelText('Usuário'), 'guilherme')
  await user.type(screen.getByLabelText('Senha'), 'segredo123')
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('LoginPage — intended destination', () => {
  it('redirects to /tasks by default when no destination was requested', async () => {
    const user = userEvent.setup()
    renderAt([{ pathname: '/login' }])

    await login(user)

    expect(await screen.findByText('Destino padrão')).toBeInTheDocument()
  })

  it('redirects to the preserved intended destination after login', async () => {
    const user = userEvent.setup()
    renderAt([{ pathname: '/login', state: { from: '/relatorios' } }])

    await login(user)

    expect(await screen.findByText('Destino pretendido')).toBeInTheDocument()
  })

  it('rejects an external URL as the intended destination, falling back to /tasks', async () => {
    const user = userEvent.setup()
    renderAt([{ pathname: '/login', state: { from: 'https://evil.example.com' } }])

    await login(user)

    expect(await screen.findByText('Destino padrão')).toBeInTheDocument()
  })
})
