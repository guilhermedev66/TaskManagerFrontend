import { describe, expect, it } from 'vitest'
import { formatRateLimitMessage } from './rateLimitMessage'

describe('formatRateLimitMessage', () => {
  it('returns a generic message when Retry-After is absent', () => {
    expect(formatRateLimitMessage(undefined)).toBe('Aguarde alguns instantes e tente novamente.')
  })

  it('uses the singular form for exactly 1 second', () => {
    expect(formatRateLimitMessage(1)).toBe('Tente novamente em 1 segundo.')
  })

  it('uses the plural form for 0 seconds', () => {
    expect(formatRateLimitMessage(0)).toBe('Tente novamente em 0 segundos.')
  })

  it('uses the plural form for multiple seconds', () => {
    expect(formatRateLimitMessage(42)).toBe('Tente novamente em 42 segundos.')
  })
})
