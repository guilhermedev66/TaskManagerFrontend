import { useEffect, useState } from 'react'

// Contagem regressiva determinística (setTimeout recursivo, não setInterval) — testável com
// fake timers. Nunca vai abaixo de zero; para sozinha ao chegar em zero (sem retry automático).
export function useCountdown(initialSeconds: number | undefined): number | undefined {
  const [remaining, setRemaining] = useState(initialSeconds)
  // Ajusta o estado durante o render (padrão oficial do React para "resetar estado quando uma
  // prop muda"), em vez de um useEffect que dispara um setState síncrono e uma renderização em
  // cascata evitável.
  const [trackedInitialSeconds, setTrackedInitialSeconds] = useState(initialSeconds)
  if (initialSeconds !== trackedInitialSeconds) {
    setTrackedInitialSeconds(initialSeconds)
    setRemaining(initialSeconds)
  }

  useEffect(() => {
    if (remaining === undefined || remaining <= 0) return

    const timer = setTimeout(() => {
      setRemaining((current) => (current === undefined ? current : Math.max(0, current - 1)))
    }, 1000)

    return () => clearTimeout(timer)
  }, [remaining])

  return remaining
}
