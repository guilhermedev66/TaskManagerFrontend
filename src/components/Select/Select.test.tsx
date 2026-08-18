import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Select } from './Select'

describe('Select', () => {
  it('associates the label with the select', () => {
    render(
      <Select label="Prioridade" defaultValue="media">
        <option value="baixa">Baixa</option>
        <option value="media">Média</option>
        <option value="alta">Alta</option>
      </Select>,
    )

    expect(screen.getByLabelText('Prioridade')).toBeInTheDocument()
  })

  it('fires onChange when the user picks a different option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Select label="Prioridade" defaultValue="media" onChange={onChange}>
        <option value="baixa">Baixa</option>
        <option value="media">Média</option>
        <option value="alta">Alta</option>
      </Select>,
    )

    await user.selectOptions(screen.getByLabelText('Prioridade'), 'alta')

    expect(onChange).toHaveBeenCalled()
    expect(screen.getByLabelText('Prioridade')).toHaveValue('alta')
  })
})
