import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, delay } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../auth/AuthProvider'
import { server } from '../../test/server'
import { LoginForm } from './LoginForm'

const BASE_URL = 'http://localhost:5078'

function renderLoginForm(onSuccess = vi.fn()) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <LoginForm onSuccess={onSuccess} />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('LoginForm', () => {
  it('focuses the username field on mount', async () => {
    renderLoginForm()
    expect(await screen.findByLabelText('Usuário')).toHaveFocus()
  })

  it('blocks submit and shows validation errors when both fields are empty', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Usuário é obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument()
  })

  it('preserves the username, clears the password, and focuses it on a 401', async () => {
    server.use(http.post(`${BASE_URL}/api/login`, () => new HttpResponse(null, { status: 401 })))
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(screen.getByLabelText('Usuário'), 'guilherme')
    await user.type(screen.getByLabelText('Senha'), 'senhaerrada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Usuário ou senha incorretos.')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuário')).toHaveValue('guilherme')
    expect(screen.getByLabelText('Senha')).toHaveValue('')
    expect(screen.getByLabelText('Senha')).toHaveFocus()
  })

  it('shows a connection-failure alert when the network request fails', async () => {
    server.use(http.post(`${BASE_URL}/api/login`, () => HttpResponse.error()))
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(screen.getByLabelText('Usuário'), 'guilherme')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Não foi possível conectar.')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuário')).toHaveValue('guilherme')
    expect(screen.getByLabelText('Senha')).toHaveValue('segredo123')
  })

  it('blocks a duplicate submit while the request is in flight', async () => {
    server.use(
      http.post(`${BASE_URL}/api/login`, async () => {
        await delay(50)
        return HttpResponse.json({ token: 'a', refreshToken: 'b' })
      }),
    )
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(screen.getByLabelText('Usuário'), 'guilherme')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled()
  })

  it('calls onSuccess after a successful login', async () => {
    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'a', refreshToken: 'b' }),
      ),
    )
    const onSuccess = vi.fn()
    const user = userEvent.setup()
    renderLoginForm(onSuccess)

    await user.type(screen.getByLabelText('Usuário'), 'guilherme')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  it('links to /register from the footer', () => {
    renderLoginForm()
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/register')
  })
})

describe('LoginForm — rate limiting', () => {
  // A mecânica pura da contagem regressiva (tick a tick, nunca negativa, reset ao mudar) já é
  // provada de forma determinística com fake timers em useCountdown.test.ts. Aqui, em nível de
  // integração, usamos timers reais com um Retry-After curto — combinar userEvent + fetch real
  // (MSW) + fake timers no mesmo teste é frágil e não agrega precisão à prova.
  it('counts down to zero, disabling submit meanwhile and re-enabling it without auto-submit', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/login`,
        () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '2' } }),
      ),
    )
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(screen.getByLabelText('Usuário'), 'guilherme')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Tente novamente em 2 segundos.')).toBeInTheDocument()
    const submit = screen.getByRole('button', { name: 'Entrar' })
    expect(submit).toBeDisabled()

    expect(
      await screen.findByText('Tente novamente em 1 segundo.', {}, { timeout: 2000 }),
    ).toBeInTheDocument()
    expect(submit).toBeDisabled()

    await vi.waitFor(() => expect(submit).not.toBeDisabled(), { timeout: 2000 })
    expect(screen.queryByText(/Tente novamente/)).not.toBeInTheDocument()
  }, 8000)
})
