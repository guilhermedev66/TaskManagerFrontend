import { useRef, useState, type RefObject } from 'react'
import { Alert } from '../../../components/Alert/Alert'
import { Button } from '../../../components/Button/Button'
import { useDialogFocusTrap } from '../../../lib/useDialogFocusTrap'
import { ConnectionError, getSafeErrorMessage } from '../../../lib/api/apiErrors'
import styles from './DeleteTaskDialog.module.css'

export interface DeleteTaskDialogProps {
  open: boolean
  taskTitle: string
  onConfirm: () => Promise<void>
  onClose: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

// Confirmação conservadora: sem digitação exigida, foco inicial em Cancelar (a ação menos
// destrutiva), duplo-submit bloqueado via isDeleting, falha preserva o diálogo pra tentar de novo.
export function DeleteTaskDialog({
  open,
  taskTitle,
  onConfirm,
  onClose,
  triggerRef,
}: DeleteTaskDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setErrorMessage(null)
  }

  function requestClose() {
    if (!isDeleting) onClose()
  }

  useDialogFocusTrap(open, dialogRef, triggerRef, requestClose, cancelRef)

  async function handleConfirm() {
    if (isDeleting) return
    setIsDeleting(true)
    setErrorMessage(null)
    try {
      await onConfirm()
    } catch (error) {
      setErrorMessage(
        error instanceof ConnectionError
          ? 'Não foi possível conectar. Verifique sua internet e tente novamente.'
          : getSafeErrorMessage(error),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={requestClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-task-title"
        className={styles.panel}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-task-title" className={styles.title}>
          Excluir tarefa
        </h2>
        <p className={styles.description}>
          Tem certeza que deseja excluir <strong>{taskTitle}</strong>? Essa ação não pode ser
          desfeita.
        </p>
        {errorMessage ? <Alert tone="danger" title={errorMessage} /> : null}
        <div className={styles.footer}>
          <Button ref={cancelRef} variant="secondary" onClick={requestClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="danger-solid"
            loading={isDeleting}
            loadingLabel="Excluindo..."
            onClick={handleConfirm}
          >
            Excluir
          </Button>
        </div>
      </div>
    </div>
  )
}
