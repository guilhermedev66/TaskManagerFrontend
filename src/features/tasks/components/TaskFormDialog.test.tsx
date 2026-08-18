import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, ConnectionError } from '../../../lib/api/apiErrors'
import type { ValidationProblemDetails } from '../../../types/problemDetails'
import type { TaskItem } from '../../../types/tasks'
import { TaskFormDialog } from './TaskFormDialog'

function renderDialog(props: Partial<React.ComponentProps<typeof TaskFormDialog>> = {}) {
  const triggerRef = createRef<HTMLButtonElement>()
  const onSubmitForm = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  render(
    <div>
      <button ref={triggerRef}>Nova tarefa</button>
      <TaskFormDialog
        open
        mode="create"
        onSubmitForm={onSubmitForm}
        onClose={onClose}
        triggerRef={triggerRef}
        {...props}
      />
    </div>,
  )
  return { onSubmitForm, onClose, triggerRef }
}

describe('TaskFormDialog', () => {
  it('renders a real modal dialog with initial focus on the title field', () => {
    renderDialog()
    expect(screen.getByRole('dialog', { name: 'Nova tarefa' })).toHaveAttribute(
      'aria-modal',
      'true',
    )
    expect(screen.getByLabelText('Título')).toHaveFocus()
  })

  it('shows a validation error and blocks submit when title is empty', async () => {
    const user = userEvent.setup()
    const { onSubmitForm } = renderDialog()
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }))
    expect(await screen.findByText('Título é obrigatório')).toBeInTheDocument()
    expect(onSubmitForm).not.toHaveBeenCalled()
  })

  it('submits the trimmed form values on a valid submit', async () => {
    const user = userEvent.setup()
    const { onSubmitForm } = renderDialog()
    await user.type(screen.getByLabelText('Título'), '  Comprar leite  ')
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }))
    await waitFor(() => expect(onSubmitForm).toHaveBeenCalledTimes(1))
    expect(onSubmitForm.mock.calls[0][0].title).toBe('Comprar leite')
  })

  it('blocks a double submit while the first submit is still pending', async () => {
    const user = userEvent.setup()
    let resolveSubmit: () => void = () => {}
    const onSubmitForm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        }),
    )
    renderDialog({ onSubmitForm })
    await user.type(screen.getByLabelText('Título'), 'Comprar leite')
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }))
    await user.click(screen.getByRole('button', { name: /Criando tarefa/ }))
    resolveSubmit()
    await waitFor(() => expect(onSubmitForm).toHaveBeenCalledTimes(1))
  })

  it('does not close with Escape while a submit is pending', async () => {
    const user = userEvent.setup()
    let resolveSubmit: () => void = () => {}
    const onSubmitForm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        }),
    )
    const { onClose } = renderDialog({ onSubmitForm })
    await user.type(screen.getByLabelText('Título'), 'Comprar leite')
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }))

    await user.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()

    resolveSubmit()
    await waitFor(() => expect(onSubmitForm).toHaveBeenCalledOnce())
  })

  it('shows a connection-failure message and preserves the typed values', async () => {
    const user = userEvent.setup()
    const onSubmitForm = vi.fn().mockRejectedValue(new ConnectionError('sem conexão'))
    renderDialog({ onSubmitForm })
    await user.type(screen.getByLabelText('Título'), 'Comprar leite')
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }))
    expect(await screen.findByText(/Não foi possível conectar/)).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toHaveValue('Comprar leite')
  })

  it('maps a ValidationProblemDetails server error to the matching field, inline', async () => {
    const user = userEvent.setup()
    const problemDetails: ValidationProblemDetails = {
      status: 400,
      title: 'Bad Request',
      errors: { Title: ['Título inválido no servidor'] },
    }
    const onSubmitForm = vi
      .fn()
      .mockRejectedValue(new ApiError({ status: 400, title: 'Bad Request', problemDetails }))
    renderDialog({ onSubmitForm })
    await user.type(screen.getByLabelText('Título'), 'Comprar leite')
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }))
    expect(await screen.findByText('Título inválido no servidor')).toBeInTheDocument()
  })

  it('Escape calls onClose (retorno de foco real é testado de forma integrada no dashboard)', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('edit mode shows the Concluída checkbox and pre-fills values from the task', () => {
    const task: TaskItem = {
      id: 1,
      title: 'Comprar leite',
      description: 'Integral',
      priority: 2,
      createdAt: '2026-01-01T00:00:00Z',
      dueDate: '2026-12-01T00:00:00Z',
      isCompleted: false,
    }
    renderDialog({ mode: 'edit', task })
    expect(screen.getByLabelText('Título')).toHaveValue('Comprar leite')
    expect(screen.getByLabelText('Descrição')).toHaveValue('Integral')
    expect(screen.getByRole('checkbox', { name: 'Concluída' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()
  })
})
