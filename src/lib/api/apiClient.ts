import { isProblemDetails, isValidationProblemDetails } from '../../types/problemDetails'
import { ApiError, ConnectionError } from './apiErrors'
import { getApiBaseUrl } from './environment'

export interface ApiRequestOptions {
  method?: string
  body?: unknown
  accessToken?: string
  headers?: HeadersInit
  signal?: AbortSignal
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

// Erro de programação (path malformado no código-fonte, não entrada de usuário) — TypeError
// simples, sem hierarquia própria. Roda antes de montar headers/Authorization e antes do fetch.
//
// A mensagem nunca inclui o valor bruto de `path`: ele pode conter acidentalmente
// credenciais, token, query string ou dado pessoal (ex.: uma URL externa completa passada
// por engano no lugar do path).
function assertValidPath(path: string): void {
  if (!path.startsWith('/')) {
    throw new TypeError('apiRequest: o caminho deve começar com "/".')
  }
  if (path.startsWith('//')) {
    throw new TypeError('apiRequest: o caminho não pode começar com "//".')
  }
}

function parseRetryAfterSeconds(headers: Headers): number | undefined {
  const raw = headers.get('Retry-After')
  if (raw === null) return undefined

  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return undefined

  const value = Number(trimmed)
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

async function buildApiError(response: Response): Promise<ApiError> {
  const retryAfterSeconds = parseRetryAfterSeconds(response.headers)
  const payload = await readJsonBody(response)

  if (isValidationProblemDetails(payload)) {
    return new ApiError({
      status: response.status,
      title: payload.title,
      type: payload.type,
      detail: payload.detail,
      validationErrors: payload.errors,
      retryAfterSeconds,
      problemDetails: payload,
    })
  }

  if (isProblemDetails(payload)) {
    return new ApiError({
      status: response.status,
      title: payload.title,
      type: payload.type,
      detail: payload.detail,
      retryAfterSeconds,
      problemDetails: payload,
    })
  }

  // Payload desconhecido/malformado: nunca faz cast cego, cai em erro genérico com o status real.
  return new ApiError({ status: response.status, retryAfterSeconds })
}

// Wrapper fino sobre fetch: não conhece React, TanStack Query, sessionStorage, refresh ou retry.
// Essas responsabilidades pertencem às camadas que virão nas próximas fases.
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  assertValidPath(path)

  const { method = 'GET', body, accessToken, headers, signal } = options

  const requestHeaders = new Headers(headers)
  // Authorization só pode entrar pela opção `accessToken` — remove qualquer valor herdado de
  // `options.headers` para que ninguém injete um token por fora do canal previsto.
  requestHeaders.delete('Authorization')
  requestHeaders.set('Accept', 'application/json')
  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }
  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new ConnectionError('Não foi possível conectar ao servidor.', { cause: error })
  }

  if (!response.ok) {
    throw await buildApiError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await readJsonBody(response)
  return payload as T
}
