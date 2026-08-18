// Valores numéricos espelham o enum TaskPriority do backend (sem JsonStringEnumConverter,
// então o JSON real transporta número, não nome).
export const TaskPriority = {
  Low: 0,
  Medium: 1,
  High: 2,
} as const

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority]

export interface TaskItem {
  id: number
  title: string
  description: string | null
  priority: TaskPriority
  createdAt: string
  dueDate: string | null
  isCompleted: boolean
}

export interface CreateTaskRequest {
  title: string
  description?: string | null
  priority?: TaskPriority
  dueDate?: string | null
}

export interface UpdateTaskRequest {
  title: string
  description?: string | null
  priority?: TaskPriority
  dueDate?: string | null
  isCompleted: boolean
}

export interface PagedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

// Nomes idênticos aos membros dos enums em TaskQuery.cs — o model binder do ASP.NET Core
// aceita o nome do membro (case-insensitive) em querystring.
export const TASK_STATUS_FILTERS = ['All', 'Pending', 'Completed'] as const
export type TaskStatusFilter = (typeof TASK_STATUS_FILTERS)[number]

export const TASK_SORT_BY_VALUES = ['CreatedAt', 'DueDate', 'Priority', 'Title'] as const
export type TaskSortBy = (typeof TASK_SORT_BY_VALUES)[number]

export const SORT_DIRECTIONS = ['Asc', 'Desc'] as const
export type SortDirection = (typeof SORT_DIRECTIONS)[number]

export interface TaskQueryParams {
  page?: number
  pageSize?: number
  status?: TaskStatusFilter
  title?: string
  sortBy?: TaskSortBy
  sortDirection?: SortDirection
}
