// Datas do backend chegam como string UTC (convenção já documentada). Conversão para exibição
// só acontece aqui, no ponto de apresentação — o tipo continua string em todo o resto do app.
const MONTH_ABBREVIATIONS = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
]

export function formatDueDate(dueDate: string | null): string {
  const parsed = parseUtcDate(dueDate)
  if (!parsed) return 'Sem prazo'
  const day = String(parsed.getUTCDate()).padStart(2, '0')
  const month = MONTH_ABBREVIATIONS[parsed.getUTCMonth()]
  return `${day} ${month}`
}

export function isTaskOverdue(
  dueDate: string | null,
  isCompleted: boolean,
  now: Date = new Date(),
): boolean {
  if (isCompleted) return false
  const parsed = parseUtcDate(dueDate)
  if (!parsed) return false
  // Corte no fim do dia UTC do prazo (início do dia seguinte) — consistente perto da meia-noite,
  // independente do fuso do navegador.
  const endOfDueDateUtc = Date.UTC(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate() + 1,
  )
  return now.getTime() >= endOfDueDateUtc
}

function parseUtcDate(value: string | null): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}
