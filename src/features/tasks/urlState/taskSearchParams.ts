import {
  TASK_SORT_BY_VALUES,
  TASK_STATUS_FILTERS,
  SORT_DIRECTIONS,
  type SortDirection,
  type TaskSortBy,
  type TaskStatusFilter,
} from '../../../types/tasks'

export const TASKS_PAGE_SIZE = 10

export interface TaskFilters {
  page: number
  status: TaskStatusFilter
  title: string
  sortBy: TaskSortBy
  sortDirection: SortDirection
}

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  page: 1,
  status: 'All',
  title: '',
  sortBy: 'CreatedAt',
  sortDirection: 'Desc',
}

function parsePage(raw: string | null): number {
  if (!raw) return DEFAULT_TASK_FILTERS.page
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_TASK_FILTERS.page
  return parsed
}

function parseEnum<T extends string>(raw: string | null, allowed: readonly T[], fallback: T): T {
  if (raw && (allowed as readonly string[]).includes(raw)) return raw as T
  return fallback
}

export function parseTaskFilters(searchParams: URLSearchParams): TaskFilters {
  return {
    page: parsePage(searchParams.get('page')),
    status: parseEnum(searchParams.get('status'), TASK_STATUS_FILTERS, DEFAULT_TASK_FILTERS.status),
    title: searchParams.get('title')?.trim() ?? DEFAULT_TASK_FILTERS.title,
    sortBy: parseEnum(searchParams.get('sortBy'), TASK_SORT_BY_VALUES, DEFAULT_TASK_FILTERS.sortBy),
    sortDirection: parseEnum(
      searchParams.get('sortDirection'),
      SORT_DIRECTIONS,
      DEFAULT_TASK_FILTERS.sortDirection,
    ),
  }
}

// Omite valores default da URL — mantém a URL limpa e a serialização determinística.
export function toSearchParams(filters: TaskFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.page !== DEFAULT_TASK_FILTERS.page) params.set('page', String(filters.page))
  if (filters.status !== DEFAULT_TASK_FILTERS.status) params.set('status', filters.status)
  if (filters.title !== DEFAULT_TASK_FILTERS.title) params.set('title', filters.title)
  if (filters.sortBy !== DEFAULT_TASK_FILTERS.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortDirection !== DEFAULT_TASK_FILTERS.sortDirection) {
    params.set('sortDirection', filters.sortDirection)
  }
  return params
}
