import type { SortDirection, TaskSortBy } from '../../../types/tasks'

export interface SortOption {
  value: string
  label: string
  sortBy: TaskSortBy
  sortDirection: SortDirection
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'CreatedAt:Desc', label: 'Mais recentes', sortBy: 'CreatedAt', sortDirection: 'Desc' },
  { value: 'CreatedAt:Asc', label: 'Mais antigas', sortBy: 'CreatedAt', sortDirection: 'Asc' },
  { value: 'DueDate:Asc', label: 'Prazo mais próximo', sortBy: 'DueDate', sortDirection: 'Asc' },
  { value: 'DueDate:Desc', label: 'Prazo mais distante', sortBy: 'DueDate', sortDirection: 'Desc' },
  { value: 'Priority:Desc', label: 'Maior prioridade', sortBy: 'Priority', sortDirection: 'Desc' },
  { value: 'Priority:Asc', label: 'Menor prioridade', sortBy: 'Priority', sortDirection: 'Asc' },
  { value: 'Title:Asc', label: 'Título A–Z', sortBy: 'Title', sortDirection: 'Asc' },
  { value: 'Title:Desc', label: 'Título Z–A', sortBy: 'Title', sortDirection: 'Desc' },
]

export function sortOptionValue(sortBy: TaskSortBy, sortDirection: SortDirection): string {
  return `${sortBy}:${sortDirection}`
}

export function findSortOption(sortBy: TaskSortBy, sortDirection: SortDirection): SortOption {
  return (
    SORT_OPTIONS.find(
      (option) => option.sortBy === sortBy && option.sortDirection === sortDirection,
    ) ?? SORT_OPTIONS[0]
  )
}
