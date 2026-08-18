import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../auth/useAuth'
import { ApiError } from '../../../lib/api/apiErrors'
import { toUpdateTaskRequest } from '../forms/taskFormMapping'
import type { TaskFormValues } from '../forms/taskFormSchema'
import { updateTask } from './tasksMutationsApi'

export interface UpdateTaskVariables {
  id: number
  values: TaskFormValues
}

// PUT substitui o registro inteiro (sem PATCH/toggle) — usado pelo formulário de edição.
// Sem atualização otimista aqui de propósito: o formulário só fecha depois da confirmação
// real do servidor (diferente do toggle de conclusão, que é otimista).
export function useUpdateTaskMutation() {
  const { authenticatedRequest } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: UpdateTaskVariables) =>
      updateTask(authenticatedRequest, id, toUpdateTaskRequest(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 404) {
        void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }
    },
  })
}
