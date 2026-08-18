import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActiveFilterChip } from './ActiveFilterChip'

describe('ActiveFilterChip', () => {
  it('has an accessible name including the label on the remove button', () => {
    render(<ActiveFilterChip label="Pendentes" onRemove={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Remover filtro Pendentes' })).toBeInTheDocument()
  })

  it('calls onRemove when clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<ActiveFilterChip label="Pendentes" onRemove={onRemove} />)
    await user.click(screen.getByRole('button', { name: 'Remover filtro Pendentes' }))
    expect(onRemove).toHaveBeenCalledOnce()
  })
})
