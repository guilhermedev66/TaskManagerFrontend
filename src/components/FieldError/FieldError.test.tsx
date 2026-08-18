import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FieldError } from './FieldError'

describe('FieldError', () => {
  it('renders the error message text', () => {
    render(<FieldError id="username-error">Informe um usuário válido.</FieldError>)

    expect(screen.getByText('Informe um usuário válido.')).toBeInTheDocument()
  })
})
