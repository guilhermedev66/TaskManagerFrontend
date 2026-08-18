import { z } from 'zod'
import { TaskPriority } from '../../../types/tasks'

// Compara o instante UTC de meia-noite da data escolhida contra "agora" — espelha
// exatamente a regra do backend (`DueDate < DateTime.UtcNow`), que rejeita até "hoje" depois
// da meia-noite já ter passado. Não é uma regra "inventada" no frontend, é a mesma do servidor.
function isPastInstant(dateOnly: string): boolean {
  const parsed = new Date(`${dateOnly}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.getTime() < Date.now()
}

// Description não tem MaxLength no backend (CreateTaskRequest/UpdateTaskRequest) — por isso
// não impomos um limite aqui que o servidor não exige.
export const taskFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Título é obrigatório')
      .max(100, 'Título deve ter no máximo 100 caracteres'),
    description: z.string().trim(),
    priority: z.union([
      z.literal(TaskPriority.Low),
      z.literal(TaskPriority.Medium),
      z.literal(TaskPriority.High),
    ]),
    dueDate: z.string(),
    isCompleted: z.boolean(),
  })
  .refine((data) => !data.dueDate || data.isCompleted || !isPastInstant(data.dueDate), {
    message: 'Prazo não pode estar no passado para tarefas pendentes.',
    path: ['dueDate'],
  })

export type TaskFormValues = z.infer<typeof taskFormSchema>

export const TASK_FORM_DEFAULTS: TaskFormValues = {
  title: '',
  description: '',
  priority: TaskPriority.Medium,
  dueDate: '',
  isCompleted: false,
}
