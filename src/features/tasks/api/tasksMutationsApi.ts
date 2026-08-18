import type { AuthContextValue } from '../../../auth/AuthContext'
import type { CreateTaskRequest, TaskItem, UpdateTaskRequest } from '../../../types/tasks'

export function createTask(
  authenticatedRequest: AuthContextValue['authenticatedRequest'],
  body: CreateTaskRequest,
): Promise<TaskItem> {
  return authenticatedRequest<TaskItem>('/api/tasks', { method: 'POST', body })
}

export function updateTask(
  authenticatedRequest: AuthContextValue['authenticatedRequest'],
  id: number,
  body: UpdateTaskRequest,
): Promise<undefined> {
  return authenticatedRequest<undefined>(`/api/tasks/${id}`, { method: 'PUT', body })
}

export function deleteTask(
  authenticatedRequest: AuthContextValue['authenticatedRequest'],
  id: number,
): Promise<undefined> {
  return authenticatedRequest<undefined>(`/api/tasks/${id}`, { method: 'DELETE' })
}
