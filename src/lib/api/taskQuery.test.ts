import { describe, expect, it } from 'vitest'
import { serializeTaskQuery } from './taskQuery'

describe('serializeTaskQuery', () => {
  it('serializes the full combination of parameters', () => {
    const search = serializeTaskQuery({
      page: 2,
      pageSize: 20,
      status: 'Pending',
      title: 'revisar',
      sortBy: 'DueDate',
      sortDirection: 'Asc',
    })

    expect(search.toString()).toBe(
      'page=2&pageSize=20&status=Pending&title=revisar&sortBy=DueDate&sortDirection=Asc',
    )
  })

  it('omits parameters that are not provided', () => {
    const search = serializeTaskQuery({ page: 1 })

    expect(search.toString()).toBe('page=1')
    expect(search.has('title')).toBe(false)
    expect(search.has('status')).toBe(false)
  })

  it('omits an empty title instead of sending an accidental empty value', () => {
    const search = serializeTaskQuery({ title: '' })

    expect(search.has('title')).toBe(false)
  })

  it('omits a whitespace-only title', () => {
    const search = serializeTaskQuery({ title: '   ' })

    expect(search.has('title')).toBe(false)
  })

  it('trims a title before setting it, matching the backend Trim()', () => {
    const search = serializeTaskQuery({ title: '  revisão de tarefa  ' })

    expect(search.get('title')).toBe('revisão de tarefa')
  })

  it('encodes a title with accents and spaces', () => {
    const search = serializeTaskQuery({ title: 'revisão de tarefa' })

    expect(search.get('title')).toBe('revisão de tarefa')
    expect(search.toString()).toContain('title=revis')
  })

  it('never duplicates a parameter', () => {
    const search = serializeTaskQuery({ status: 'All', sortBy: 'Title' })

    expect(search.getAll('status')).toHaveLength(1)
    expect(search.getAll('sortBy')).toHaveLength(1)
  })
})
