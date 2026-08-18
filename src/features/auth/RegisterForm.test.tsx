import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../auth/AuthProvider'
import { server } from '../../test/server'
import { RegisterForm } from './RegisterForm'

const BASE_URL = 'http://localhost:5078'

function renderRegisterForm(onRegistered = vi.fn()) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/register']}>
        <RegisterForm onRegistered={onRegistered} />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('RegisterForm', () => {
  it('shows minimum-length validation errors alongside the persistent helper text', async () => {
    const user = userEvent.setup()
    renderRegisterForm()

    await user.type(screen.getByLabelText('Usuário'), 'ab')
    await user.type(screen.getByLabelText('Senha'), '123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Usuário deve ter pelo menos 3 caracteres')).toBeInTheDocument()
    expect(screen.getByText('Senha deve ter pelo menos 6 caracteres')).toBeInTheDocument()
    expect(screen.getByText('Mínimo de 6 caracteres.')).toBeInTheDocument()
  })

  it('shows a username-taken alert on a 409 response', async () => {
    server.use(http.post(`${BASE_URL}/api/register`, () => new HttpResponse(null, { status: 409 })))
    const user = userEvent.setup()
    renderRegisterForm()

    await user.type(screen.getByLabelText('Usuário'), 'guilherme')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Esse nome de usuário já está em uso.')).toBeInTheDocument()
  })

  it('calls onRegistered after a successful registration', async () => {
    server.use(
      http.post(`${BASE_URL}/api/register`, () =>
        HttpResponse.json({ message: 'Usuário registrado com sucesso.' }),
      ),
    )
    const onRegistered = vi.fn()
    const user = userEvent.setup()
    renderRegisterForm(onRegistered)

    await user.type(screen.getByLabelText('Usuário'), 'guilherme')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    await vi.waitFor(() => expect(onRegistered).toHaveBeenCalledOnce())
  })

  it('links to /login from the footer', () => {
    renderRegisterForm()
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
  })
})

describe('RegisterForm — rate limiting', () => {
  // Mesma justificativa do LoginForm: mecânica pura do countdown já provada com fake timers em
  // useCountdown.test.ts; aqui, integração com timers reais e um Retry-After curto.
  it('counts down to zero and re-enables submit without auto-submitting', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/register`,
        () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '1' } }),
      ),
    )
    const user = userEvent.setup()
    renderRegisterForm()

    await user.type(screen.getByLabelText('Usuário'), 'guilherme')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Muitas tentativas de cadastro.')).toBeInTheDocument()
    const submit = screen.getByRole('button', { name: 'Criar conta' })
    expect(submit).toBeDisabled()

    await vi.waitFor(() => expect(submit).not.toBeDisabled(), { timeout: 2000 })
  }, 8000)
})
