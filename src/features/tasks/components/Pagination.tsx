import { useEffect, useRef } from 'react'
import { cx } from '../../../lib/cx'
import { buildPaginationItems } from '../pagination/paginationModel'
import styles from './Pagination.module.css'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

// Foco previsível após troca de página: move para o próprio heading da região (via ref exposto
// pelo caller) NÃO é responsabilidade deste componente — aqui só focamos o botão da página atual
// depois da troca, nunca com tabindex positivo.
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const currentPageRef = useRef<HTMLButtonElement>(null)
  const previousPageRef = useRef(page)

  useEffect(() => {
    if (previousPageRef.current !== page) {
      currentPageRef.current?.focus()
    }
    previousPageRef.current = page
  }, [page])

  if (totalPages <= 1) return null

  const items = buildPaginationItems(page, totalPages)

  return (
    <nav aria-label="Paginação" className={styles.nav}>
      <button
        type="button"
        className={styles.navButton}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Página anterior"
      >
        Anterior
      </button>

      <span className={styles.pagesDesktop}>
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className={styles.ellipsis} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              ref={item === page ? currentPageRef : undefined}
              type="button"
              className={cx(styles.pageButton, item === page && styles.currentPage)}
              aria-current={item === page ? 'page' : undefined}
              aria-label={`Página ${item}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ),
        )}
      </span>

      <span className={styles.pagesMobile} aria-live="polite">
        Página {page} de {totalPages}
      </span>

      <button
        type="button"
        className={styles.navButton}
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Próxima página"
      >
        Próxima
      </button>
    </nav>
  )
}
