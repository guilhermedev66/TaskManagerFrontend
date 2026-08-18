import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ConnectionError } from '../../../lib/api/apiErrors'
import { DeleteTaskDialog } from './DeleteTaskDialog'

function renderDialog(props: Partial<React.ComponentProps<typeof DeleteTaskDialog>> = {}) {
  const triggerRef = createRef<HTMLButtonElement>()
  const onConfirm = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  render(
    <div>
      <button ref={triggerRef}>Abrir exclusão</button>
      <DeleteTaskDialog
        open
        taskTitle="Comprar leite"
        onConfirm={onConfirm}
        onClose={onClose}
        triggerRef={triggerRef}
        {...props}
      />
    </div>,
  )
  return { onConfirm, onClose, triggerRef }
}

describe('DeleteTaskDialog', () => {
  it('identifies the task by title and focuses Cancelar initially', () => {
    renderDialog()
    expect(screen.getByText(/Comprar leite/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  })

  it('does not require typing to confirm', () => {
    renderDialog()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('Cancelar calls onClose without confirming', async () => {
    const user = userEvent.setup()
    const { onClose, onConfirm } = renderDialog()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Excluir calls onConfirm exactly once, even on a rapid double click', async () => {
    const user = userEvent.setup()
    let resolveConfirm: () => void = () => {}
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve
        }),
    )
    renderDialog({ onConfirm })
    const button = screen.getByRole('button', { name: /Excluir/ })
    await user.click(button)
    await user.click(button)
    resolveConfirm()
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
  })

  it('does not close with Escape while deletion is pending', async () => {
    const user = userEvent.setup()
    let resolveConfirm: () => void = () => {}
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve
        }),
    )
    const { onClose } = renderDialog({ onConfirm })
    await user.click(screen.getByRole('button', { name: /Excluir/ }))

    await user.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()

    resolveConfirm()
    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce())
  })

  it('a connection failure keeps the dialog open and shows a retry-friendly message', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn().mockRejectedValue(new ConnectionError('sem conexão'))
    renderDialog({ onConfirm })
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    expect(await screen.findByText(/Não foi possível conectar/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Excluir/ })).toBeInTheDocument()
  })
})
