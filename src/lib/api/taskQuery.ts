import type { TaskQueryParams } from '../../types/tasks'

// Só serializa valores definidos; nada de undefined/null/string vazia acidental.
export function serializeTaskQuery(params: TaskQueryParams): URLSearchParams {
  const search = new URLSearchParams()

  if (params.page !== undefined) search.set('page', String(params.page))
  if (params.pageSize !== undefined) search.set('pageSize', String(params.pageSize))
  if (params.status !== undefined) search.set('status', params.status)
  // Alinhado ao backend (IsNullOrWhiteSpace + Trim): título vazio ou só espaços é omitido;
  // espaços internos e acentos são preservados.
  if (params.title !== undefined) {
    const trimmedTitle = params.title.trim()
    if (trimmedTitle !== '') search.set('title', trimmedTitle)
  }
  if (params.sortBy !== undefined) search.set('sortBy', params.sortBy)
  if (params.sortDirection !== undefined) search.set('sortDirection', params.sortDirection)

  return search
}
