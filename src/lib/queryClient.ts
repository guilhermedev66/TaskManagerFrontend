import { QueryClient } from '@tanstack/react-query'
import { ApiError, ConnectionError } from './api/apiErrors'

// Instância única do módulo (não recriada por render). No máximo 1 retry, só para falha
// transitória de rede/5xx — nunca para 401/404/validação, que são erros determinísticos.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false
  if (error instanceof ConnectionError) return true
  if (error instanceof ApiError) return error.status >= 500
  return false
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: shouldRetry,
    },
  },
})
