import { describe, expect, it } from 'vitest'
import { taskFormSchema } from './taskFormSchema'

const BASE = {
  title: 'Tarefa',
  description: '',
  priority: 1 as const,
  dueDate: '',
  isCompleted: false,
}

describe('taskFormSchema', () => {
  it('accepts a minimal valid form (title only)', () => {
    expect(taskFormSchema.safeParse(BASE).success).toBe(true)
  })

  it('rejects an empty title', () => {
    const result = taskFormSchema.safeParse({ ...BASE, title: '  ' })
    expect(result.success).toBe(false)
  })

  it('rejects a title longer than 100 characters', () => {
    const result = taskFormSchema.safeParse({ ...BASE, title: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('accepts a title with exactly 100 characters', () => {
    expect(taskFormSchema.safeParse({ ...BASE, title: 'a'.repeat(100) }).success).toBe(true)
  })

  it('rejects a past due date for a pending (not completed) task', () => {
    const result = taskFormSchema.safeParse({ ...BASE, dueDate: '2020-01-01', isCompleted: false })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['dueDate'])
    }
  })

  it('accepts a past due date when the task is completed', () => {
    const result = taskFormSchema.safeParse({ ...BASE, dueDate: '2020-01-01', isCompleted: true })
    expect(result.success).toBe(true)
  })

  it('accepts a future due date for a pending task', () => {
    const result = taskFormSchema.safeParse({ ...BASE, dueDate: '2099-01-01', isCompleted: false })
    expect(result.success).toBe(true)
  })

  it('accepts an empty due date (no prazo)', () => {
    expect(taskFormSchema.safeParse({ ...BASE, dueDate: '' }).success).toBe(true)
  })

  it('rejects a priority outside 0|1|2', () => {
    const result = taskFormSchema.safeParse({ ...BASE, priority: 3 })
    expect(result.success).toBe(false)
  })
})
