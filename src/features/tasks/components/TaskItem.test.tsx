import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { TaskItem as TaskItemType } from '../../../types/tasks'
import { TaskItem } from './TaskItem'

function buildTask(overrides: Partial<TaskItemType> = {}): TaskItemType {
  return {
    id: 1,
    title: 'Comprar leite',
    description: null,
    priority: 1,
    createdAt: '2026-01-01T00:00:00Z',
    dueDate: null,
    isCompleted: false,
    ...overrides,
  }
}

function renderItem(
  overrides: Partial<TaskItemType> = {},
  props: Partial<React.ComponentProps<typeof TaskItem>> = {},
) {
  const onToggleComplete = vi.fn()
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  render(
    <ul>
      <TaskItem
        task={buildTask(overrides)}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
        {...props}
      />
    </ul>,
  )
  return { onToggleComplete, onEdit, onDelete }
}

describe('TaskItem', () => {
  it('renders the title, "Sem prazo" when there is no due date, and Pendente status', () => {
    renderItem()
    expect(screen.getAllByText('Comprar leite').length).toBeGreaterThan(0)
    expect(screen.getByText('Sem prazo')).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('shows "Atrasada" only for a past due date on an incomplete task', () => {
    renderItem({ dueDate: '2020-01-01T00:00:00Z', isCompleted: false })
    expect(screen.getByText(/Atrasada/)).toBeInTheDocument()
  })

  it('never shows "Atrasada" for a completed task, even with a past due date', () => {
    renderItem({ dueDate: '2020-01-01T00:00:00Z', isCompleted: true })
    expect(screen.queryByText(/Atrasada/)).not.toBeInTheDocument()
    expect(screen.getByText('Concluída')).toBeInTheDocument()
  })

  it('exposes the full title as an accessible name on the title wrapper (even if visually truncated)', () => {
    const longTitle = 'T'.repeat(200)
    renderItem({ title: longTitle })
    expect(screen.getByLabelText(longTitle)).toBeInTheDocument()
  })

  it('has a native checkbox reflecting isCompleted, with an accessible name including the full title', () => {
    renderItem({ title: 'Comprar leite', isCompleted: false })
    const checkbox = screen.getByRole('checkbox', { name: 'Marcar "Comprar leite" como concluída' })
    expect(checkbox).not.toBeChecked()
  })

  it('calls onToggleComplete with the task when the checkbox is toggled (Space works natively)', async () => {
    const user = userEvent.setup()
    const { onToggleComplete } = renderItem({ isCompleted: false })
    await user.click(screen.getByRole('checkbox'))
    expect(onToggleComplete).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Comprar leite' }),
    )
  })

  it('has Editar and Excluir as separate sibling controls with accessible names including the title', () => {
    renderItem({ title: 'Comprar leite' })
    expect(screen.getByRole('button', { name: 'Editar "Comprar leite"' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Excluir "Comprar leite"' })).toBeInTheDocument()
  })

  it('calls onEdit / onDelete with the task when their buttons are clicked', async () => {
    const user = userEvent.setup()
    const { onEdit, onDelete } = renderItem({ title: 'Comprar leite' })
    await user.click(screen.getByRole('button', { name: 'Editar "Comprar leite"' }))
    await user.click(screen.getByRole('button', { name: 'Excluir "Comprar leite"' }))
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Comprar leite' }))
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ title: 'Comprar leite' }))
  })

  it('disables checkbox, Editar and Excluir while this row is toggling or deleting', () => {
    renderItem({}, { isToggling: true })
    expect(screen.getByRole('checkbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: /Editar/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Excluir/ })).toBeDisabled()
  })

  it('renders a toggle failure as an alert inside the affected row', () => {
    renderItem({}, { errorMessage: 'Não foi possível atualizar esta tarefa.' })

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível atualizar esta tarefa.')
  })
})
