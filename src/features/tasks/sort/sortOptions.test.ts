import { describe, expect, it } from 'vitest'
import { SORT_OPTIONS, findSortOption, sortOptionValue } from './sortOptions'

describe('sortOptions', () => {
  it('has exactly the 8 combinations with the exact label -> enum mapping', () => {
    expect(SORT_OPTIONS).toEqual([
      {
        value: 'CreatedAt:Desc',
        label: 'Mais recentes',
        sortBy: 'CreatedAt',
        sortDirection: 'Desc',
      },
      { value: 'CreatedAt:Asc', label: 'Mais antigas', sortBy: 'CreatedAt', sortDirection: 'Asc' },
      {
        value: 'DueDate:Asc',
        label: 'Prazo mais próximo',
        sortBy: 'DueDate',
        sortDirection: 'Asc',
      },
      {
        value: 'DueDate:Desc',
        label: 'Prazo mais distante',
        sortBy: 'DueDate',
        sortDirection: 'Desc',
      },
      {
        value: 'Priority:Desc',
        label: 'Maior prioridade',
        sortBy: 'Priority',
        sortDirection: 'Desc',
      },
      {
        value: 'Priority:Asc',
        label: 'Menor prioridade',
        sortBy: 'Priority',
        sortDirection: 'Asc',
      },
      { value: 'Title:Asc', label: 'Título A–Z', sortBy: 'Title', sortDirection: 'Asc' },
      { value: 'Title:Desc', label: 'Título Z–A', sortBy: 'Title', sortDirection: 'Desc' },
    ])
  })

  it('sortOptionValue combines sortBy and sortDirection with a colon', () => {
    expect(sortOptionValue('DueDate', 'Asc')).toBe('DueDate:Asc')
  })

  it('findSortOption returns the matching option for a given sortBy/sortDirection pair', () => {
    expect(findSortOption('Title', 'Desc').label).toBe('Título Z–A')
  })

  it('findSortOption falls back to the first option for an unknown combination', () => {
    // @ts-expect-error testando entrada fora da união deliberadamente
    expect(findSortOption('Unknown', 'Desc')).toBe(SORT_OPTIONS[0])
  })
})
