import { describe, expect, it } from 'vitest'
import { DEFAULT_TASK_FILTERS, parseTaskFilters, toSearchParams } from './taskSearchParams'

describe('parseTaskFilters', () => {
  it('returns all defaults for an empty URL', () => {
    expect(parseTaskFilters(new URLSearchParams(''))).toEqual(DEFAULT_TASK_FILTERS)
  })

  it('parses valid values for every field', () => {
    const params = new URLSearchParams(
      'page=3&status=Completed&title=comprar&sortBy=DueDate&sortDirection=Asc',
    )
    expect(parseTaskFilters(params)).toEqual({
      page: 3,
      status: 'Completed',
      title: 'comprar',
      sortBy: 'DueDate',
      sortDirection: 'Asc',
    })
  })

  it('normalizes an invalid page (non-numeric, zero, negative, decimal) to 1', () => {
    expect(parseTaskFilters(new URLSearchParams('page=abc')).page).toBe(1)
    expect(parseTaskFilters(new URLSearchParams('page=0')).page).toBe(1)
    expect(parseTaskFilters(new URLSearchParams('page=-2')).page).toBe(1)
    expect(parseTaskFilters(new URLSearchParams('page=2.5')).page).toBe(1)
  })

  it('normalizes an invalid status to All', () => {
    expect(parseTaskFilters(new URLSearchParams('status=Archived')).status).toBe('All')
  })

  it('normalizes an invalid sortBy/sortDirection to defaults', () => {
    const filters = parseTaskFilters(new URLSearchParams('sortBy=Nope&sortDirection=Sideways'))
    expect(filters.sortBy).toBe('CreatedAt')
    expect(filters.sortDirection).toBe('Desc')
  })

  it('trims surrounding whitespace from title', () => {
    expect(
      parseTaskFilters(new URLSearchParams('title=' + encodeURIComponent('  comprar  '))).title,
    ).toBe('comprar')
  })
})

describe('toSearchParams', () => {
  it('omits every field equal to its default', () => {
    expect(toSearchParams(DEFAULT_TASK_FILTERS).toString()).toBe('')
  })

  it('includes only the non-default fields', () => {
    const params = toSearchParams({ ...DEFAULT_TASK_FILTERS, page: 2, title: 'x' })
    expect(params.get('page')).toBe('2')
    expect(params.get('title')).toBe('x')
    expect(params.has('status')).toBe(false)
    expect(params.has('sortBy')).toBe(false)
    expect(params.has('sortDirection')).toBe(false)
  })

  it('round-trips: parse(toSearchParams(filters)) === filters', () => {
    const filters = {
      page: 5,
      status: 'Pending' as const,
      title: 'a',
      sortBy: 'Priority' as const,
      sortDirection: 'Asc' as const,
    }
    expect(parseTaskFilters(toSearchParams(filters))).toEqual(filters)
  })
})
