import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState, type RefObject } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '../../../components/Alert/Alert'
import { Button } from '../../../components/Button/Button'
import { Checkbox } from '../../../components/Checkbox/Checkbox'
import { Select } from '../../../components/Select/Select'
import { Textarea } from '../../../components/Textarea/Textarea'
import { TextField } from '../../../components/TextField/TextField'
import { useDialogFocusTrap } from '../../../lib/useDialogFocusTrap'
import { ApiError, ConnectionError, getSafeErrorMessage } from '../../../lib/api/apiErrors'
import { isValidationProblemDetails } from '../../../types/problemDetails'
import type { TaskItem } from '../../../types/tasks'
import { applyTaskServerValidationErrors, taskToFormValues } from '../forms/taskFormMapping'
import { TASK_FORM_DEFAULTS, taskFormSchema, type TaskFormValues } from '../forms/taskFormSchema'
import styles from './TaskFormDialog.module.css'

export interface TaskFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  task?: TaskItem
  onSubmitForm: (values: TaskFormValues) => Promise<void>
  onClose: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

export function TaskFormDialog({
  open,
  mode,
  task,
  onSubmitForm,
  onClose,
  triggerRef,
}: TaskFormDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [wasOpen, setWasOpen] = useState(open)
  const [connectionAlert, setConnectionAlert] = useState<string | null>(null)

  const defaultValues = task ? taskToFormValues(task) : TASK_FORM_DEFAULTS

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  })

  // Ajuste de estado durante a renderização (não em efeito): reseta o formulário com os
  // valores certos só na transição fechado -> aberto (cada abertura começa de um estado limpo).
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      reset(defaultValues)
      setConnectionAlert(null)
    }
  }

  function requestClose() {
    if (!isSubmitting) onClose()
  }

  useDialogFocusTrap(open, dialogRef, triggerRef, requestClose, titleInputRef)

  const { ref: titleRegisterRef, ...titleRegister } = register('title')

  async function onSubmit(values: TaskFormValues) {
    setConnectionAlert(null)
    try {
      await onSubmitForm(values)
    } catch (error) {
      if (error instanceof ApiError && isValidationProblemDetails(error.problemDetails)) {
        applyTaskServerValidationErrors(setError, error.problemDetails.errors)
        return
      }
      if (error instanceof ConnectionError) {
        setConnectionAlert('Não foi possível conectar. Verifique sua internet e tente novamente.')
        return
      }
      // 404 (edição de tarefa já excluída) é tratado pelo caller (fecha o diálogo e mostra
      // mensagem contextual na página) — aqui só cobrimos o que mantém o diálogo aberto.
      if (error instanceof ApiError && error.status === 404) {
        throw error
      }
      setConnectionAlert(getSafeErrorMessage(error))
    }
  }

  if (!open) return null

  const titleId = mode === 'create' ? 'create-task-title' : 'edit-task-title'

  return (
    <div className={styles.backdrop} onClick={requestClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.panel}
        onClick={(event) => event.stopPropagation()}
      >
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {mode === 'create' ? 'Nova tarefa' : 'Editar tarefa'}
            </h2>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Fechar"
              disabled={isSubmitting}
              onClick={requestClose}
            >
              ×
            </button>
          </div>

          <div className={styles.body}>
            {connectionAlert ? <Alert tone="danger" title={connectionAlert} /> : null}

            <TextField
              ref={(element: HTMLInputElement | null) => {
                titleRegisterRef(element)
                titleInputRef.current = element
              }}
              label="Título"
              error={errors.title?.message}
              disabled={isSubmitting}
              {...titleRegister}
            />
            <Textarea
              label="Descrição"
              error={errors.description?.message}
              disabled={isSubmitting}
              {...register('description')}
            />
            <Select
              label="Prioridade"
              error={errors.priority?.message}
              disabled={isSubmitting}
              {...register('priority', { valueAsNumber: true })}
            >
              <option value={0}>Baixa</option>
              <option value={1}>Média</option>
              <option value={2}>Alta</option>
            </Select>
            <TextField
              type="date"
              label="Prazo"
              helperText="Opcional. Deixe em branco para Sem prazo."
              error={errors.dueDate?.message}
              disabled={isSubmitting}
              {...register('dueDate')}
            />
            {mode === 'edit' ? (
              <Checkbox label="Concluída" disabled={isSubmitting} {...register('isCompleted')} />
            ) : null}
          </div>

          <div className={styles.footer}>
            <Button
              type="button"
              variant="secondary"
              onClick={requestClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              loadingLabel={mode === 'create' ? 'Criando tarefa...' : 'Salvando alterações...'}
            >
              {mode === 'create' ? 'Criar tarefa' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
