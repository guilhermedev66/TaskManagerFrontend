import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StatusFilterGroup } from './StatusFilterGroup'

describe('StatusFilterGroup', () => {
  it('renders the three status options as radios inside a fieldset', () => {
    render(<StatusFilterGroup value="All" onChange={vi.fn()} />)
    expect(screen.getByRole('group')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Todos/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Pendentes/ })).not.toBeChecked()
  })

  it('calls onChange with the selected value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StatusFilterGroup value="All" onChange={onChange} />)
    await user.click(screen.getByRole('radio', { name: /Pendentes/ }))
    expect(onChange).toHaveBeenCalledWith('Pending')
  })
})
