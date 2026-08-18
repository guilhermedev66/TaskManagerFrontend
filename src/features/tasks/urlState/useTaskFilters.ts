import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SortDirection, TaskSortBy, TaskStatusFilter } from '../../../types/tasks'
import {
  DEFAULT_TASK_FILTERS,
  parseTaskFilters,
  toSearchParams,
  type TaskFilters,
} from './taskSearchParams'

export interface FilterDraft {
  status: TaskStatusFilter
  sortBy: TaskSortBy
  sortDirection: SortDirection
}

export interface UseTaskFiltersResult {
  filters: TaskFilters
  setPage: (page: number) => void
  setSearch: (title: string) => void
  setStatus: (status: TaskStatusFilter) => void
  setSort: (sortBy: TaskSortBy, sortDirection: SortDirection) => void
  applyDraft: (draft: FilterDraft) => void
  clearFilters: () => void
}

// Fonte da verdade é a URL (useSearchParams). Toda escrita usa a forma funcional
// (prev => ...) para nunca depender de um `filters` fechado sobre um valor desatualizado —
// evita loop de replace/navigate quando duas mudanças acontecem em sequência rápida.
export function useTaskFilters(): UseTaskFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseTaskFilters(searchParams), [searchParams])

  const setPage = useCallback(
    (page: number) => {
      setSearchParams((prev) => toSearchParams({ ...parseTaskFilters(prev), page }))
    },
    [setSearchParams],
  )

  const setSearch = useCallback(
    (title: string) => {
      setSearchParams(
        (prev) =>
          toSearchParams({ ...parseTaskFilters(prev), title, page: DEFAULT_TASK_FILTERS.page }),
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setStatus = useCallback(
    (status: TaskStatusFilter) => {
      setSearchParams((prev) =>
        toSearchParams({ ...parseTaskFilters(prev), status, page: DEFAULT_TASK_FILTERS.page }),
      )
    },
    [setSearchParams],
  )

  const setSort = useCallback(
    (sortBy: TaskSortBy, sortDirection: SortDirection) => {
      setSearchParams((prev) =>
        toSearchParams({
          ...parseTaskFilters(prev),
          sortBy,
          sortDirection,
          page: DEFAULT_TASK_FILTERS.page,
        }),
      )
    },
    [setSearchParams],
  )

  const applyDraft = useCallback(
    (draft: FilterDraft) => {
      setSearchParams((prev) =>
        toSearchParams({ ...parseTaskFilters(prev), ...draft, page: DEFAULT_TASK_FILTERS.page }),
      )
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams((prev) =>
      toSearchParams({
        ...parseTaskFilters(prev),
        page: DEFAULT_TASK_FILTERS.page,
        status: DEFAULT_TASK_FILTERS.status,
        title: DEFAULT_TASK_FILTERS.title,
      }),
    )
  }, [setSearchParams])

  return { filters, setPage, setSearch, setStatus, setSort, applyDraft, clearFilters }
}
