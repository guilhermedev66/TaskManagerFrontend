import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchField } from './SearchField'

describe('SearchField', () => {
  it('shows typed text immediately but only calls onDebouncedChange after the debounce window', async () => {
    const user = userEvent.setup()
    const onDebouncedChange = vi.fn()
    render(<SearchField value="" onDebouncedChange={onDebouncedChange} />)

    const input = screen.getByLabelText('Buscar tarefas por título')
    await user.type(input, 'leite')

    expect(input).toHaveValue('leite')
    expect(onDebouncedChange).not.toHaveBeenCalled()

    await waitFor(() => expect(onDebouncedChange).toHaveBeenCalledWith('leite'), { timeout: 1000 })
    expect(onDebouncedChange).toHaveBeenCalledTimes(1)
  })

  it('clears immediately (no debounce) and resets the value', async () => {
    const user = userEvent.setup()
    const onDebouncedChange = vi.fn()
    render(<SearchField value="leite" onDebouncedChange={onDebouncedChange} />)

    await user.click(screen.getByRole('button', { name: 'Limpar busca' }))

    expect(screen.getByLabelText('Buscar tarefas por título')).toHaveValue('')
    expect(onDebouncedChange).toHaveBeenCalledWith('')
  })

  it('syncs the field when the external value changes (browser back/forward)', () => {
    const { rerender } = render(<SearchField value="" onDebouncedChange={vi.fn()} />)
    rerender(<SearchField value="pao" onDebouncedChange={vi.fn()} />)
    expect(screen.getByLabelText('Buscar tarefas por título')).toHaveValue('pao')
  })

  it('cancels a pending local search when navigation changes the external value', async () => {
    const user = userEvent.setup()
    const onDebouncedChange = vi.fn()
    const { rerender } = render(
      <SearchField value="" debounceMs={30} onDebouncedChange={onDebouncedChange} />,
    )

    await user.type(screen.getByLabelText('Buscar tarefas por título'), 'valor antigo')
    rerender(
      <SearchField value="valor da url" debounceMs={30} onDebouncedChange={onDebouncedChange} />,
    )

    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(onDebouncedChange).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Buscar tarefas por título')).toHaveValue('valor da url')
  })
})
