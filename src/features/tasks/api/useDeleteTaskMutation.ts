import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../auth/useAuth'
import { ApiError } from '../../../lib/api/apiErrors'
import { deleteTask } from './tasksMutationsApi'

// Exclusão fica conservadora (sem otimismo): só sai da lista depois da confirmação real do
// servidor. Se a página atual ficar vazia após invalidar, o efeito de normalização já existente
// em TasksDashboardPage (mesma lógica usada para uma página fora do intervalo) corrige sozinho.
export function useDeleteTaskMutation() {
  const { authenticatedRequest } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteTask(authenticatedRequest, id),
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
