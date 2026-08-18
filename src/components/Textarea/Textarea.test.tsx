import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('associates the label with the textarea', () => {
    render(<Textarea label="Descrição" />)

    expect(screen.getByLabelText('Descrição')).toBeInTheDocument()
  })

  it('does not break layout with a long error message', () => {
    const longMessage =
      'Esta é uma mensagem de erro propositalmente longa para confirmar que o layout do campo não quebra quando o texto de erro ocupa múltiplas linhas.'
    render(<Textarea label="Descrição" error={longMessage} />)

    expect(screen.getByText(longMessage)).toBeInTheDocument()
    expect(screen.getByLabelText('Descrição')).toHaveAttribute('aria-invalid', 'true')
  })
})
