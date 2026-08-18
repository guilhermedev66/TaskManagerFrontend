import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../auth/useAuth'
import { toCreateTaskRequest } from '../forms/taskFormMapping'
import type { TaskFormValues } from '../forms/taskFormSchema'
import { createTask } from './tasksMutationsApi'

export function useCreateTaskMutation() {
  const { authenticatedRequest } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: TaskFormValues) =>
      createTask(authenticatedRequest, toCreateTaskRequest(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
