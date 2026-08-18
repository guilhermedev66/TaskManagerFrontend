import type { ProblemDetails } from '../../types/problemDetails'

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

export class ConnectionError extends Error {
  constructor(message = 'Não foi possível conectar ao servidor.', options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ConnectionError'
  }
}

export interface ApiErrorOptions {
  status: number
  title?: string
  type?: string
  detail?: string
  validationErrors?: Record<string, string[]>
  retryAfterSeconds?: number
  problemDetails?: ProblemDetails
}

// Guarda os dados técnicos crus (title/detail/problemDetails) separados de qualquer mensagem
// exibível ao usuário — a UI nunca deve renderizar error.detail diretamente.
export class ApiError extends Error {
  readonly status: number
  readonly title?: string
  readonly type?: string
  readonly detail?: string
  readonly validationErrors?: Record<string, string[]>
  readonly retryAfterSeconds?: number
  readonly problemDetails?: ProblemDetails

  constructor(options: ApiErrorOptions) {
    // Mensagem técnica genérica e controlada pelo cliente — nunca o title/detail bruto do
    // servidor, que pode conter texto arbitrário não confiável. Use `getSafeErrorMessage`
    // para mensagem de UI e as propriedades `title`/`detail` para dados técnicos.
    super(`Falha na requisição HTTP (status ${options.status}).`)
    this.name = 'ApiError'
    this.status = options.status
    this.title = options.title
    this.type = options.type
    this.detail = options.detail
    this.validationErrors = options.validationErrors
    this.retryAfterSeconds = options.retryAfterSeconds
    this.problemDetails = options.problemDetails
  }
}

// Mensagem segura por status conhecido — nunca repassa detail/title vindos do servidor.
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Dados inválidos. Revise os campos e tente novamente.'
      case 401:
        return 'Sessão inválida ou expirada.'
      case 404:
        return 'Recurso não encontrado.'
      case 409:
        return 'Conflito: o recurso já existe ou está em uso.'
      case 429:
        return 'Muitas tentativas. Aguarde antes de tentar novamente.'
      default:
        return error.status >= 500
          ? 'Erro no servidor. Tente novamente mais tarde.'
          : 'Não foi possível concluir a solicitação.'
    }
  }

  if (error instanceof ConnectionError) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.'
  }

  if (error instanceof ConfigurationError) {
    return error.message
  }

  return 'Ocorreu um erro inesperado.'
}
