import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FilterSheet } from './FilterSheet'

const CURRENT = {
  status: 'All' as const,
  sortBy: 'CreatedAt' as const,
  sortDirection: 'Desc' as const,
}

function renderSheet(props: Partial<React.ComponentProps<typeof FilterSheet>> = {}) {
  const triggerRef = createRef<HTMLButtonElement>()
  const onApply = vi.fn()
  const onClose = vi.fn()
  render(
    <div>
      <button ref={triggerRef}>Filtros e ordenação</button>
      <FilterSheet
        open
        current={CURRENT}
        onApply={onApply}
        onClose={onClose}
        triggerRef={triggerRef}
        {...props}
      />
    </div>,
  )
  return { onApply, onClose, triggerRef }
}

// Harness com estado real: onClose de fato fecha o diálogo, para provar o retorno de foco
// (o efeito de cleanup do FilterSheet só dispara quando `open` realmente vira false).
function StatefulHarness() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button ref={triggerRef} onClick={() => setOpen(true)}>
        Filtros e ordenação
      </button>
      <FilterSheet
        open={open}
        current={CURRENT}
        onApply={vi.fn()}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
      />
    </div>
  )
}

describe('FilterSheet', () => {
  it('renders as a real modal dialog', () => {
    renderSheet()
    const dialog = screen.getByRole('dialog', { name: 'Filtros e ordenação' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('Cancelar discards the draft and closes without applying', async () => {
    const user = userEvent.setup()
    const { onApply, onClose } = renderSheet()
    await user.click(screen.getByRole('radio', { name: /Pendentes/ }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(onApply).not.toHaveBeenCalled()
  })

  it('Limpar only resets the draft and does not close or call the API', async () => {
    const user = userEvent.setup()
    const { onApply, onClose } = renderSheet()
    await user.click(screen.getByRole('radio', { name: /Pendentes/ }))
    await user.click(screen.getByRole('button', { name: 'Limpar' }))
    expect(onClose).not.toHaveBeenCalled()
    expect(onApply).not.toHaveBeenCalled()
    expect(screen.getByRole('radio', { name: /Todos/ })).toBeChecked()
  })

  it('Aplicar commits the full draft in one call', async () => {
    const user = userEvent.setup()
    const { onApply } = renderSheet()
    await user.click(screen.getByRole('radio', { name: /Concluídas/ }))
    await user.click(screen.getByText('Título A–Z'))
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(onApply).toHaveBeenCalledWith({
      status: 'Completed',
      sortBy: 'Title',
      sortDirection: 'Asc',
    })
  })

  it('Escape closes the sheet (same as Cancelar)', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSheet()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('moves focus into the dialog on open', () => {
    renderSheet()
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)
  })

  it('returns focus to the trigger button after the dialog actually closes', async () => {
    const user = userEvent.setup()
    render(<StatefulHarness />)
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtros e ordenação' })).toHaveFocus()
  })
})
