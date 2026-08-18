import { describe, expect, it } from 'vitest'
import { ApiError, ConfigurationError, ConnectionError, getSafeErrorMessage } from './apiErrors'

describe('ApiError', () => {
  it('keeps message generic and technical, never echoing title or detail from the server', () => {
    const maliciousTitle = '<script>alert(1)</script> attacker title'
    const maliciousDetail = 'Detalhe arbitrário do servidor, potencialmente não confiável'

    const error = new ApiError({ status: 409, title: maliciousTitle, detail: maliciousDetail })

    expect(error.title).toBe(maliciousTitle)
    expect(error.detail).toBe(maliciousDetail)
    expect(error.message).toBe('Falha na requisição HTTP (status 409).')
    expect(error.message).not.toContain(maliciousTitle)
    expect(error.message).not.toContain(maliciousDetail)
  })
})

describe('getSafeErrorMessage', () => {
  it('returns only the client-defined copy for a known ApiError status, ignoring title/detail', () => {
    const error = new ApiError({
      status: 409,
      title: 'texto arbitrário do servidor',
      detail: 'outro texto arbitrário do servidor',
    })

    expect(getSafeErrorMessage(error)).toBe('Conflito: o recurso já existe ou está em uso.')
  })

  it('returns a safe copy for ConnectionError', () => {
    expect(getSafeErrorMessage(new ConnectionError())).toBe(
      'Não foi possível conectar ao servidor. Verifique sua conexão.',
    )
  })

  it('returns a safe copy for an unknown error type', () => {
    expect(getSafeErrorMessage(new Error('qualquer coisa'))).toBe('Ocorreu um erro inesperado.')
  })

  it('surfaces the ConfigurationError message as-is, since it is developer-facing and secret-free', () => {
    const error = new ConfigurationError('VITE_API_URL não configurada.')

    expect(getSafeErrorMessage(error)).toBe('VITE_API_URL não configurada.')
  })
})
