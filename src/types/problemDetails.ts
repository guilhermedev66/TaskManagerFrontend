export interface ProblemDetails {
  type?: string
  title?: string
  status: number
  detail?: string
  instance?: string
}

export interface ValidationProblemDetails extends ProblemDetails {
  errors: Record<string, string[]>
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export function isProblemDetails(value: unknown): value is ProblemDetails {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>

  // O backend ASP.NET atual sempre envia `status` no corpo — exigir isso descarta objeto
  // vazio ou arbitrário sem estrutura real de ProblemDetails.
  if (typeof record.status !== 'number') return false

  if ('title' in record && record.title !== undefined && typeof record.title !== 'string') {
    return false
  }
  if ('type' in record && record.type !== undefined && typeof record.type !== 'string') {
    return false
  }
  if ('detail' in record && record.detail !== undefined && typeof record.detail !== 'string') {
    return false
  }
  if (
    'instance' in record &&
    record.instance !== undefined &&
    typeof record.instance !== 'string'
  ) {
    return false
  }

  return true
}

export function isValidationProblemDetails(value: unknown): value is ValidationProblemDetails {
  if (!isProblemDetails(value)) return false
  const record = value as unknown as Record<string, unknown>

  if (typeof record.errors !== 'object' || record.errors === null) return false

  return Object.values(record.errors as Record<string, unknown>).every(isStringArray)
}
