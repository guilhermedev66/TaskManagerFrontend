import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert } from './Alert'

describe('Alert', () => {
  it('renders the title and an optional description', () => {
    render(<Alert tone="danger" title="Usuário ou senha incorretos." />)

    expect(screen.getByText('Usuário ou senha incorretos.')).toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(
      <Alert
        tone="warning"
        title="Muitas tentativas de login."
        description="Tente novamente em 42 segundos."
      />,
    )

    expect(screen.getByText('Tente novamente em 42 segundos.')).toBeInTheDocument()
  })

  it('uses an assertive role for danger and warning tones', () => {
    const { rerender } = render(<Alert tone="danger" title="Erro" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    rerender(<Alert tone="warning" title="Aviso" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('uses a polite status role for the success tone', () => {
    render(<Alert tone="success" title="Cadastro realizado com sucesso." />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
