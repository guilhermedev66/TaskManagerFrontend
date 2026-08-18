import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('toggles state when the label is clicked', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Marcar como concluída" />)

    const checkbox = screen.getByRole('checkbox', { name: 'Marcar como concluída' })
    expect(checkbox).not.toBeChecked()

    await user.click(screen.getByText('Marcar como concluída'))

    expect(checkbox).toBeChecked()
  })

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Marcar como concluída" disabled />)

    const checkbox = screen.getByRole('checkbox', { name: 'Marcar como concluída' })
    await user.click(checkbox)

    expect(checkbox).not.toBeChecked()
  })
})
