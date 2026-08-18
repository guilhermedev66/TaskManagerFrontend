import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders with an accessible name from its content', () => {
    render(<Button variant="primary">Salvar</Button>)

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
  })

  it('blocks interaction while loading', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button variant="primary" loading onClick={onClick}>
        Salvar
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Carregando' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('blocks interaction while disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button variant="primary" disabled onClick={onClick}>
        Salvar
      </Button>,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('uses loadingLabel as the accessible name when provided', () => {
    render(
      <Button variant="primary" loading loadingLabel="Criando tarefa">
        Criar tarefa
      </Button>,
    )

    expect(screen.getByRole('button', { name: 'Criando tarefa' })).toBeInTheDocument()
  })
})
