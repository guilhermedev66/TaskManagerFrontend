import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FormEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PasswordField } from './PasswordField'

describe('PasswordField', () => {
  it('toggles between Mostrar and Ocultar senha', async () => {
    const user = userEvent.setup()
    render(<PasswordField label="Senha" />)

    const toggle = screen.getByRole('button', { name: 'Mostrar senha' })
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')

    await user.click(toggle)

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toBeInTheDocument()
  })

  it('preserves the typed value when toggling visibility', async () => {
    const user = userEvent.setup()
    render(<PasswordField label="Senha" />)

    const input = screen.getByLabelText('Senha')
    await user.type(input, 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))

    expect(input).toHaveValue('segredo123')
  })

  it('does not submit an enclosing form when the toggle is clicked', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <PasswordField label="Senha" />
      </form>,
    )

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('keeps focus on the toggle itself after clicking it, not on the input', async () => {
    const user = userEvent.setup()
    render(<PasswordField label="Senha" />)

    const toggle = screen.getByRole('button', { name: 'Mostrar senha' })
    await user.click(toggle)

    expect(document.activeElement).toBe(toggle)
  })
})
