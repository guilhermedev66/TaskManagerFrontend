import { useEffect, useRef, useState } from 'react'
import styles from './SearchField.module.css'

export interface SearchFieldProps {
  value: string
  onDebouncedChange: (value: string) => void
  debounceMs?: number
}

// Estado local (inputValue) reflete o que o usuário digita imediatamente; a busca real
// (onDebouncedChange -> URL/query) só dispara 350ms depois de parar de digitar. `value`
// sincroniza o campo quando a URL muda por fora (navegação back/forward).
export function SearchField({ value, onDebouncedChange, debounceMs = 350 }: SearchFieldProps) {
  const [inputValue, setInputValue] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Ajuste de estado durante a renderização (não em efeito): sincroniza o campo quando `value`
  // muda por fora (navegação back/forward) — sem depender de um efeito só para espelhar a prop.
  if (value !== prevValue) {
    setPrevValue(value)
    setInputValue(value)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }, [value])

  function handleChange(next: string) {
    setInputValue(next)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => onDebouncedChange(next.trim()), debounceMs)
  }

  function handleClear() {
    setInputValue('')
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    onDebouncedChange('')
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.visuallyHidden} htmlFor="task-search">
        Buscar tarefas por título
      </label>
      <input
        id="task-search"
        type="search"
        className={styles.input}
        placeholder="Buscar por título"
        value={inputValue}
        onChange={(event) => handleChange(event.target.value)}
      />
      {inputValue ? (
        <button
          type="button"
          className={styles.clearButton}
          aria-label="Limpar busca"
          onClick={handleClear}
        >
          ×
        </button>
      ) : null}
    </div>
  )
}
