import { serializeTaskQuery } from '../../../lib/api/taskQuery'
import type { AuthContextValue } from '../../../auth/AuthContext'
import type { PagedResponse, TaskItem, TaskQueryParams } from '../../../types/tasks'

export function fetchTasks(
  authenticatedRequest: AuthContextValue['authenticatedRequest'],
  params: TaskQueryParams,
  signal: AbortSignal,
): Promise<PagedResponse<TaskItem>> {
  const search = serializeTaskQuery(params).toString()
  const path = search ? `/api/tasks?${search}` : '/api/tasks'
  return authenticatedRequest<PagedResponse<TaskItem>>(path, { signal })
}
