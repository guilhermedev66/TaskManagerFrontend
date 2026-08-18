import { useEffect, useRef, type RefObject } from 'react'

// Foco inicial (primeiro elemento focável, ou um alvo explícito), Tab/Shift+Tab presos dentro
// do diálogo, Escape fecha, e o foco retorna ao gatilho quando o diálogo realmente fecha —
// comportamento compartilhado por todo diálogo modal do app (bottom sheet, formulário, confirmação).
export function useDialogFocusTrap(
  open: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>,
): void {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const dialog = dialogRef.current
    const trigger = triggerRef.current
    const initialTarget =
      initialFocusRef?.current ??
      dialog?.querySelector<HTMLElement>('button, input, select, textarea, [tabindex]')
    initialTarget?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('disabled'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      trigger?.focus()
    }
  }, [open, dialogRef, triggerRef, initialFocusRef])
}
