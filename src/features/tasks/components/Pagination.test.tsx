import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders nothing when totalPages <= 1', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('wraps controls in a nav landmark labeled Paginação', () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument()
  })

  it('disables Anterior on the first page and Próxima on the last page', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima página' })).not.toBeDisabled()

    rerender(<Pagination page={3} totalPages={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Página anterior' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
  })

  it('marks the current page with aria-current="page" and an accessible "Página N" name', () => {
    render(<Pagination page={2} totalPages={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('calls onPageChange with the clicked page number', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />)
    await user.click(screen.getByRole('button', { name: 'Página 3' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('calls onPageChange(page - 1) / (page + 1) for Anterior/Próxima', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination page={2} totalPages={3} onPageChange={onPageChange} />)
    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(onPageChange).toHaveBeenLastCalledWith(3)
    await user.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(onPageChange).toHaveBeenLastCalledWith(1)
  })
})
