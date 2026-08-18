import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useAuth } from '../../../auth/useAuth'
import type { PagedResponse, TaskItem } from '../../../types/tasks'
import { TASKS_PAGE_SIZE, type TaskFilters } from '../urlState/taskSearchParams'
import { fetchTasks } from './tasksApi'

export function tasksQueryKey(filters: TaskFilters) {
  return [
    'tasks',
    {
      page: filters.page,
      pageSize: TASKS_PAGE_SIZE,
      status: filters.status,
      title: filters.title,
      sortBy: filters.sortBy,
      sortDirection: filters.sortDirection,
    },
  ] as const
}

export function useTasksQuery(filters: TaskFilters): UseQueryResult<PagedResponse<TaskItem>> {
  const { authenticatedRequest } = useAuth()

  return useQuery({
    queryKey: tasksQueryKey(filters),
    queryFn: ({ signal }) =>
      fetchTasks(authenticatedRequest, { ...filters, pageSize: TASKS_PAGE_SIZE }, signal),
  })
}
