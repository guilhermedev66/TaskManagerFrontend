export type PaginationItem = number | 'ellipsis'

// Até 7 páginas: mostra todas. Acima disso: primeira, última, janela ±1 ao redor da atual,
// e uma elipse única em cada lado quando houver um intervalo maior que 1 página escondida.
export function buildPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 1) return [1]
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const windowStart = Math.max(2, currentPage - 1)
  const windowEnd = Math.min(totalPages - 1, currentPage + 1)

  const items: PaginationItem[] = [1]
  if (windowStart > 2) items.push('ellipsis')
  for (let page = windowStart; page <= windowEnd; page++) {
    items.push(page)
  }
  if (windowEnd < totalPages - 1) items.push('ellipsis')
  items.push(totalPages)

  return items
}
