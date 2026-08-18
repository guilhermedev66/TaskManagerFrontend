import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextField } from './TextField'

describe('TextField', () => {
  it('associates the label with the input', () => {
    render(<TextField label="Usuário" />)

    expect(screen.getByLabelText('Usuário')).toBeInTheDocument()
  })

  it('associates the error message via aria-describedby', () => {
    render(<TextField label="Usuário" error="Campo obrigatório." />)

    const input = screen.getByLabelText('Usuário')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)).toHaveTextContent('Campo obrigatório.')
  })

  it('sets aria-invalid only when there is an error', () => {
    const { rerender } = render(<TextField label="Usuário" />)
    expect(screen.getByLabelText('Usuário')).not.toHaveAttribute('aria-invalid')

    rerender(<TextField label="Usuário" error="Campo obrigatório." />)
    expect(screen.getByLabelText('Usuário')).toHaveAttribute('aria-invalid', 'true')
  })

  it('keeps helper and error both visible and both referenced in aria-describedby', () => {
    render(
      <TextField
        label="Usuário"
        helperText="Use de 3 a 50 caracteres."
        error="Campo obrigatório."
      />,
    )

    const input = screen.getByLabelText('Usuário')
    expect(screen.getByText('Use de 3 a 50 caracteres.')).toBeVisible()
    expect(screen.getByText('Campo obrigatório.')).toBeVisible()

    const describedBy = input.getAttribute('aria-describedby')!.split(' ')
    expect(describedBy).toHaveLength(2)
    const [firstId, secondId] = describedBy
    expect(firstId).not.toBe(secondId)
    expect(document.getElementById(firstId)).toHaveTextContent('Use de 3 a 50 caracteres.')
    expect(document.getElementById(secondId)).toHaveTextContent('Campo obrigatório.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
})
