import type { UseFormSetError } from 'react-hook-form'
import type { CreateTaskRequest, TaskItem, UpdateTaskRequest } from '../../../types/tasks'
import type { TaskFormValues } from './taskFormSchema'

export function taskToFormValues(task: TaskItem): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    dueDate: toDateInputValue(task.dueDate),
    isCompleted: task.isCompleted,
  }
}

// Backend guarda datas como string UTC; <input type="date"> só entende "YYYY-MM-DD".
export function toDateInputValue(dueDate: string | null): string {
  if (!dueDate) return ''
  const parsed = new Date(dueDate)
  if (Number.isNaN(parsed.getTime())) return ''
  const year = parsed.getUTCFullYear()
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const day = String(parsed.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toApiDueDate(dueDate: string): string | null {
  return dueDate ? `${dueDate}T00:00:00Z` : null
}

export function toCreateTaskRequest(values: TaskFormValues): CreateTaskRequest {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    priority: values.priority,
    dueDate: toApiDueDate(values.dueDate),
  }
}

export function toUpdateTaskRequest(values: TaskFormValues): UpdateTaskRequest {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    priority: values.priority,
    dueDate: toApiDueDate(values.dueDate),
    isCompleted: values.isCompleted,
  }
}

const SERVER_FIELD_TO_FORM_FIELD: Record<string, keyof TaskFormValues> = {
  title: 'title',
  description: 'description',
  priority: 'priority',
  duedate: 'dueDate',
  iscompleted: 'isCompleted',
}

// Servidor continua a validação definitiva: mapeia ValidationProblemDetails.errors (nomes de
// campo em C#, PascalCase) para as chaves do formulário e mostra a primeira mensagem de cada
// campo reconhecido. Campos não reconhecidos são ignorados, não quebram o formulário.
export function applyTaskServerValidationErrors(
  setError: UseFormSetError<TaskFormValues>,
  validationErrors: Record<string, string[]>,
): void {
  for (const [field, messages] of Object.entries(validationErrors)) {
    const key = SERVER_FIELD_TO_FORM_FIELD[field.toLowerCase()]
    const message = messages[0]
    if (!key || !message) continue
    setError(key, { type: 'server', message })
  }
}
