import { useRef, useState } from 'react'
import { Button } from '../../../components/Button/Button'
import { useDialogFocusTrap } from '../../../lib/useDialogFocusTrap'
import type { SortDirection, TaskSortBy, TaskStatusFilter } from '../../../types/tasks'
import { SORT_OPTIONS, sortOptionValue } from '../sort/sortOptions'
import { DEFAULT_TASK_FILTERS } from '../urlState/taskSearchParams'
import { StatusFilterGroup } from './StatusFilterGroup'
import styles from './FilterSheet.module.css'

export interface FilterSheetDraft {
  status: TaskStatusFilter
  sortBy: TaskSortBy
  sortDirection: SortDirection
}

export interface FilterSheetProps {
  open: boolean
  current: FilterSheetDraft
  onApply: (draft: FilterSheetDraft) => void
  onClose: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

// Diálogo real (aria-modal, focus trap, Escape, retorno de foco). Status+ordenação vivem num
// rascunho local: Cancelar/Escape/backdrop descartam, Limpar só reseta o rascunho (sem fechar),
// só Aplicar confirma — e é a única ação que de fato dispara uma nova consulta.
export function FilterSheet({ open, current, onApply, onClose, triggerRef }: FilterSheetProps) {
  const [draft, setDraft] = useState<FilterSheetDraft>(current)
  const [wasOpen, setWasOpen] = useState(open)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Ajuste de estado durante a renderização (não em efeito): sincroniza o rascunho com os
  // valores atuais só na transição fechado -> aberto, sem precisar de um efeito dedicado.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setDraft(current)
  }

  useDialogFocusTrap(open, dialogRef, triggerRef, onClose)

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
        className={styles.panel}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="filter-sheet-title" className={styles.title}>
            Filtros e ordenação
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Fechar"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <StatusFilterGroup
              value={draft.status}
              onChange={(status) => setDraft((prev) => ({ ...prev, status }))}
              name="filter-sheet-status"
              legend="Status"
            />
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Ordenar por</h3>
            <ul className={styles.sortList}>
              {SORT_OPTIONS.map((option) => {
                const selected = option.value === sortOptionValue(draft.sortBy, draft.sortDirection)
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={styles.sortOption}
                      aria-pressed={selected}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          sortBy: option.sortBy,
                          sortDirection: option.sortDirection,
                        }))
                      }
                    >
                      {option.label}
                      {selected ? <span aria-hidden="true">✓</span> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.clearLink}
            onClick={() =>
              setDraft({
                status: DEFAULT_TASK_FILTERS.status,
                sortBy: DEFAULT_TASK_FILTERS.sortBy,
                sortDirection: DEFAULT_TASK_FILTERS.sortDirection,
              })
            }
          >
            Limpar
          </button>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => onApply(draft)}>
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  )
}
