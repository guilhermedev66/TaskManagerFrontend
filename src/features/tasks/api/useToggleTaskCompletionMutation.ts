import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useAuth } from '../../../auth/useAuth'
import type { PagedResponse, TaskItem } from '../../../types/tasks'
import { updateTask } from './tasksMutationsApi'

interface ToggleContext {
  snapshot: Array<[QueryKey, PagedResponse<TaskItem> | undefined]>
}

// Concluir/reabrir não tem endpoint de toggle — é um PUT completo preservando todos os campos
// atuais e alterando só isCompleted. Otimista: atualiza o cache imediatamente (snapshot para
// rollback em falha) e reconcilia com o servidor no settled, sucesso ou erro.
export function useToggleTaskCompletionMutation() {
  const { authenticatedRequest } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<undefined, unknown, TaskItem, ToggleContext>({
    mutationFn: (task) =>
      updateTask(authenticatedRequest, task.id, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        isCompleted: !task.isCompleted,
      }),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const snapshot = queryClient.getQueriesData<PagedResponse<TaskItem>>({ queryKey: ['tasks'] })

      queryClient.setQueriesData<PagedResponse<TaskItem>>({ queryKey: ['tasks'] }, (data) => {
        if (!data) return data
        return {
          ...data,
          items: data.items.map((item) =>
            item.id === task.id ? { ...item, isCompleted: !task.isCompleted } : item,
          ),
        }
      })

      return { snapshot }
    },
    onError: (_error, _task, context) => {
      context?.snapshot.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
