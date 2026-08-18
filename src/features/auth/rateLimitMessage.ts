// Regra do handoff Gate 4: singular/plural corretos, nunca negativo, e sem inventar contagem
// quando o header Retry-After não veio (undefined) — mensagem genérica nesse caso.
export function formatRateLimitMessage(retryAfterSeconds: number | undefined): string {
  if (retryAfterSeconds === undefined) {
    return 'Aguarde alguns instantes e tente novamente.'
  }

  const unit = retryAfterSeconds === 1 ? 'segundo' : 'segundos'
  return `Tente novamente em ${retryAfterSeconds} ${unit}.`
}
