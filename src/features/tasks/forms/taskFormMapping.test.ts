import { describe, expect, it, vi } from 'vitest'
import type { TaskItem } from '../../../types/tasks'
import {
  applyTaskServerValidationErrors,
  taskToFormValues,
  toCreateTaskRequest,
  toDateInputValue,
  toUpdateTaskRequest,
} from './taskFormMapping'

function buildTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 1,
    title: 'Comprar leite',
    description: 'Integral',
    priority: 1,
    createdAt: '2026-01-01T00:00:00Z',
    dueDate: '2026-09-20T00:00:00Z',
    isCompleted: false,
    ...overrides,
  }
}

describe('toDateInputValue', () => {
  it('converts a UTC ISO string to YYYY-MM-DD', () => {
    expect(toDateInputValue('2026-09-20T00:00:00Z')).toBe('2026-09-20')
  })

  it('returns an empty string for null', () => {
    expect(toDateInputValue(null)).toBe('')
  })

  it('returns an empty string for an invalid date', () => {
    expect(toDateInputValue('not-a-date')).toBe('')
  })
})

describe('taskToFormValues', () => {
  it('maps every field, defaulting a null description to an empty string', () => {
    expect(taskToFormValues(buildTask({ description: null }))).toEqual({
      title: 'Comprar leite',
      description: '',
      priority: 1,
      dueDate: '2026-09-20',
      isCompleted: false,
    })
  })
})

describe('toCreateTaskRequest', () => {
  it('trims title/description and formats dueDate as UTC midnight', () => {
    expect(
      toCreateTaskRequest({
        title: '  Comprar leite  ',
        description: '  Integral  ',
        priority: 1,
        dueDate: '2099-01-01',
        isCompleted: false,
      }),
    ).toEqual({
      title: 'Comprar leite',
      description: 'Integral',
      priority: 1,
      dueDate: '2099-01-01T00:00:00Z',
    })
  })

  it('sends null description and null dueDate when both are empty', () => {
    expect(
      toCreateTaskRequest({
        title: 'X',
        description: '  ',
        priority: 0,
        dueDate: '',
        isCompleted: false,
      }),
    ).toEqual({ title: 'X', description: null, priority: 0, dueDate: null })
  })
})

describe('toUpdateTaskRequest', () => {
  it('includes isCompleted, unlike toCreateTaskRequest', () => {
    expect(
      toUpdateTaskRequest({
        title: 'X',
        description: '',
        priority: 2,
        dueDate: '',
        isCompleted: true,
      }),
    ).toEqual({ title: 'X', description: null, priority: 2, dueDate: null, isCompleted: true })
  })
})

describe('applyTaskServerValidationErrors', () => {
  it('maps recognized PascalCase server fields to form keys, using the first message', () => {
    const setError = vi.fn()
    applyTaskServerValidationErrors(setError, {
      Title: ['Título é obrigatório', 'outra mensagem'],
      DueDate: ['Prazo inválido'],
    })
    expect(setError).toHaveBeenCalledWith('title', {
      type: 'server',
      message: 'Título é obrigatório',
    })
    expect(setError).toHaveBeenCalledWith('dueDate', { type: 'server', message: 'Prazo inválido' })
  })

  it('ignores unrecognized fields without throwing', () => {
    const setError = vi.fn()
    expect(() => applyTaskServerValidationErrors(setError, { Unknown: ['x'] })).not.toThrow()
    expect(setError).not.toHaveBeenCalled()
  })
})
