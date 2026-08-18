import { describe, expect, it } from 'vitest'
import { formatDueDate, isTaskOverdue } from './formatDate'

describe('formatDueDate', () => {
  it('formats a UTC date as "DD MES" in pt-BR uppercase abbreviation', () => {
    expect(formatDueDate('2026-09-20T00:00:00Z')).toBe('20 SET')
  })

  it('returns "Sem prazo" for null', () => {
    expect(formatDueDate(null)).toBe('Sem prazo')
  })

  it('returns "Sem prazo" for an invalid date string instead of crashing', () => {
    expect(formatDueDate('not-a-date')).toBe('Sem prazo')
  })

  it('pads single-digit days', () => {
    expect(formatDueDate('2026-01-05T00:00:00Z')).toBe('05 JAN')
  })
})

describe('isTaskOverdue', () => {
  it('is never overdue when completed, even with a past due date', () => {
    expect(isTaskOverdue('2020-01-01T00:00:00Z', true, new Date('2026-01-01T00:00:00Z'))).toBe(
      false,
    )
  })

  it('is false when there is no due date', () => {
    expect(isTaskOverdue(null, false, new Date('2026-01-01T00:00:00Z'))).toBe(false)
  })

  it('is false for an invalid date string', () => {
    expect(isTaskOverdue('not-a-date', false, new Date('2026-01-01T00:00:00Z'))).toBe(false)
  })

  it('is false while still within the due date itself (same UTC day)', () => {
    const dueDate = '2026-03-10T00:00:00Z'
    expect(isTaskOverdue(dueDate, false, new Date('2026-03-10T23:59:59Z'))).toBe(false)
  })

  it('is true exactly at the start of the next UTC day (midnight edge)', () => {
    const dueDate = '2026-03-10T00:00:00Z'
    expect(isTaskOverdue(dueDate, false, new Date('2026-03-11T00:00:00Z'))).toBe(true)
  })

  it('is true for a due date well in the past', () => {
    expect(isTaskOverdue('2020-01-01T00:00:00Z', false, new Date('2026-01-01T00:00:00Z'))).toBe(
      true,
    )
  })
})
