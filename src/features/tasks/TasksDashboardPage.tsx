import { useEffect, useRef, useState } from 'react'
import { Alert } from '../../components/Alert/Alert'
import { Button } from '../../components/Button/Button'
import { ApiError, ConnectionError, getSafeErrorMessage } from '../../lib/api/apiErrors'
import type { TaskItem as TaskItemType } from '../../types/tasks'
import { useCreateTaskMutation } from './api/useCreateTaskMutation'
import { useDeleteTaskMutation } from './api/useDeleteTaskMutation'
import { useTasksQuery } from './api/useTasksQuery'
import { useToggleTaskCompletionMutation } from './api/useToggleTaskCompletionMutation'
import { useUpdateTaskMutation } from './api/useUpdateTaskMutation'
import { ActiveFilterChip } from './components/ActiveFilterChip'
import { DeleteTaskDialog } from './components/DeleteTaskDialog'
import { EmptyState } from './components/EmptyState'
import { FilterSheet } from './components/FilterSheet'
import { Pagination } from './components/Pagination'
import { SearchField } from './components/SearchField'
import { SortSelect } from './components/SortSelect'
import { StatusFilterGroup } from './components/StatusFilterGroup'
import { TaskFormDialog } from './components/TaskFormDialog'
import { TaskItem } from './components/TaskItem'
import { TaskListSkeleton } from './components/TaskListSkeleton'
import type { TaskFormValues } from './forms/taskFormSchema'
import { useTaskFilters } from './urlState/useTaskFilters'
import styles from './TasksDashboardPage.module.css'

const STATUS_LABEL: Record<string, string> = { Pending: 'Pendentes', Completed: 'Concluídas' }

interface PageMessage {
  tone: 'danger' | 'success'
  title: string
}

export function TasksDashboardPage() {
  const { filters, setPage, setSearch, setStatus, setSort, applyDraft, clearFilters } =
    useTaskFilters()
  const query = useTasksQuery(filters)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const filterTriggerRef = useRef<HTMLButtonElement>(null)
  const newTaskTriggerRef = useRef<HTMLButtonElement>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskItemType | null>(null)
  const [deletingTask, setDeletingTask] = useState<TaskItemType | null>(null)
  const [pageMessage, setPageMessage] = useState<PageMessage | null>(null)
  const [toggleErrors, setToggleErrors] = useState<Record<number, string>>({})
  const editTriggerRef = useRef<HTMLButtonElement>(null)
  const deleteTriggerRef = useRef<HTMLButtonElement>(null)

  const createMutation = useCreateTaskMutation()
  const updateMutation = useUpdateTaskMutation()
  const deleteMutation = useDeleteTaskMutation()
  const toggleMutation = useToggleTaskCompletionMutation()

  // Ajuste de estado durante a renderização (não em efeito): "houve sucesso ao menos uma vez"
  // precisa sobreviver a troca de query key (filtro/página), sem depender de um efeito só para
  // espelhar um booleano derivado.
  if (query.isSuccess && !hasLoadedOnce) {
    setHasLoadedOnce(true)
  }

  // Página fora do intervalo (ex.: URL editada manualmente, ou última tarefa da página excluída)
  // é corrigida silenciosamente para a última página válida, assim que o total real é conhecido.
  useEffect(() => {
    if (query.data && query.data.totalPages > 0 && filters.page > query.data.totalPages) {
      setPage(query.data.totalPages)
    }
  }, [query.data, filters.page, setPage])

  const showInitialSkeleton = query.isFetching && !hasLoadedOnce
  const showPartialSkeleton = query.isFetching && hasLoadedOnce

  const hasSearch = filters.title !== ''
  const hasStatusFilter = filters.status !== 'All'
  const activeFilterCount = (hasSearch ? 1 : 0) + (hasStatusFilter ? 1 : 0)

  function clearAllFilters() {
    clearFilters()
  }

  async function handleCreateSubmit(values: TaskFormValues) {
    await createMutation.mutateAsync(values)
    setCreateOpen(false)
    if (filters.page !== 1) setPage(1)
    setPageMessage({ tone: 'success', title: 'Tarefa criada.' })
  }

  async function handleEditSubmit(values: TaskFormValues) {
    if (!editingTask) return
    try {
      await updateMutation.mutateAsync({ id: editingTask.id, values })
      setEditingTask(null)
      setPageMessage({ tone: 'success', title: 'Alterações salvas.' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setEditingTask(null)
        setPageMessage({ tone: 'danger', title: 'Esta tarefa não existe mais.' })
        return
      }
      throw error
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingTask) return
    try {
      await deleteMutation.mutateAsync(deletingTask.id)
      setDeletingTask(null)
      setPageMessage({ tone: 'success', title: 'Tarefa excluída.' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setDeletingTask(null)
        setPageMessage({ tone: 'danger', title: 'Esta tarefa não existe mais.' })
        return
      }
      throw error
    }
  }

  function handleToggleComplete(task: TaskItemType) {
    setPageMessage(null)
    setToggleErrors((current) => {
      const next = { ...current }
      delete next[task.id]
      return next
    })
    toggleMutation.mutate(task, {
      onError: () => {
        setToggleErrors((current) => ({
          ...current,
          [task.id]: `Não foi possível atualizar "${task.title}". Tente novamente.`,
        }))
      },
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>PAINEL</p>
          <h1 className={styles.heading}>Minhas tarefas</h1>
          <p className={styles.subtitle}>
            {query.data
              ? `${query.data.totalItems} ${query.data.totalItems === 1 ? 'tarefa' : 'tarefas'}`
              : ' '}
          </p>
        </div>
        <Button
          ref={newTaskTriggerRef}
          variant="primary"
          className={styles.newTaskButton}
          onClick={() => setCreateOpen(true)}
        >
          Nova tarefa
        </Button>
      </div>

      {pageMessage ? (
        <div className={styles.pageMessage}>
          <Alert
            tone={pageMessage.tone === 'success' ? 'success' : 'danger'}
            title={pageMessage.title}
          />
        </div>
      ) : null}

      <div className={styles.toolbar}>
        <SearchField value={filters.title} onDebouncedChange={setSearch} />
        <div className={styles.desktopControls}>
          <StatusFilterGroup value={filters.status} onChange={setStatus} />
          <SortSelect
            sortBy={filters.sortBy}
            sortDirection={filters.sortDirection}
            onChange={setSort}
          />
        </div>
        <button
          ref={filterTriggerRef}
          type="button"
          className={styles.mobileFilterButton}
          onClick={() => setSheetOpen(true)}
        >
          Filtros e ordenação
        </button>
      </div>

      {activeFilterCount > 0 ? (
        <div className={styles.chips}>
          {hasStatusFilter ? (
            <ActiveFilterChip
              label={STATUS_LABEL[filters.status]}
              onRemove={() => setStatus('All')}
            />
          ) : null}
          {hasSearch ? (
            <ActiveFilterChip label={`Busca: ${filters.title}`} onRemove={() => setSearch('')} />
          ) : null}
          {activeFilterCount >= 2 ? (
            <button type="button" className={styles.clearAll} onClick={clearAllFilters}>
              Limpar filtros
            </button>
          ) : null}
        </div>
      ) : null}

      <FilterSheet
        open={sheetOpen}
        current={{
          status: filters.status,
          sortBy: filters.sortBy,
          sortDirection: filters.sortDirection,
        }}
        onApply={(draft) => {
          applyDraft(draft)
          setSheetOpen(false)
        }}
        onClose={() => setSheetOpen(false)}
        triggerRef={filterTriggerRef}
      />

      <TaskFormDialog
        open={createOpen}
        mode="create"
        onSubmitForm={handleCreateSubmit}
        onClose={() => setCreateOpen(false)}
        triggerRef={newTaskTriggerRef}
      />

      <TaskFormDialog
        open={editingTask !== null}
        mode="edit"
        task={editingTask ?? undefined}
        onSubmitForm={handleEditSubmit}
        onClose={() => setEditingTask(null)}
        triggerRef={editTriggerRef}
      />

      <DeleteTaskDialog
        open={deletingTask !== null}
        taskTitle={deletingTask?.title ?? ''}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingTask(null)}
        triggerRef={deleteTriggerRef}
      />

      <div className={styles.listRegion}>
        {showInitialSkeleton ? (
          <TaskListSkeleton />
        ) : showPartialSkeleton ? (
          <>
            <p role="status" className={styles.updating}>
              Atualizando lista
            </p>
            <TaskListSkeleton />
          </>
        ) : query.isError ? (
          <EmptyState
            title={
              query.error instanceof ConnectionError
                ? 'Não foi possível carregar suas tarefas'
                : 'Algo deu errado'
            }
            description={
              query.error instanceof ConnectionError
                ? 'Verifique sua conexão e tente novamente.'
                : getSafeErrorMessage(query.error)
            }
            action={
              <button type="button" className={styles.retryButton} onClick={() => query.refetch()}>
                Tentar novamente
              </button>
            }
          />
        ) : query.data && query.data.items.length === 0 ? (
          hasSearch ? (
            <EmptyState
              title={`Nenhum resultado para "${filters.title}"`}
              description="Tente outro termo de busca."
              action={
                <button type="button" className={styles.retryButton} onClick={() => setSearch('')}>
                  Limpar busca
                </button>
              }
            />
          ) : hasStatusFilter ? (
            <EmptyState
              title="Nenhuma tarefa encontrada para este filtro"
              description={`Filtro ativo: ${STATUS_LABEL[filters.status]}.`}
              action={
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => setStatus('All')}
                >
                  Limpar filtro
                </button>
              }
            />
          ) : (
            <EmptyState
              title="Você ainda não tem tarefas"
              description="Quando você criar tarefas, elas vão aparecer aqui."
            />
          )
        ) : query.data ? (
          <ul className={styles.list}>
            {query.data.items.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={(selected) => {
                  editTriggerRef.current = document.activeElement as HTMLButtonElement
                  setEditingTask(selected)
                }}
                onDelete={(selected) => {
                  deleteTriggerRef.current = document.activeElement as HTMLButtonElement
                  setDeletingTask(selected)
                }}
                isToggling={toggleMutation.isPending && toggleMutation.variables?.id === task.id}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === task.id}
                errorMessage={toggleErrors[task.id]}
              />
            ))}
          </ul>
        ) : null}
      </div>

      {query.data ? (
        <Pagination
          page={query.data.page}
          totalPages={query.data.totalPages}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  )
}
