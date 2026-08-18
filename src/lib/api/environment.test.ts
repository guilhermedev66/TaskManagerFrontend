import { describe, expect, it } from 'vitest'
import { ConfigurationError } from './apiErrors'
import { resolveApiBaseUrl } from './environment'

describe('resolveApiBaseUrl', () => {
  it('accepts a valid http URL, trims whitespace and drops the trailing slash', () => {
    expect(resolveApiBaseUrl(' http://localhost:5078/ ')).toBe('http://localhost:5078')
  })

  it('accepts a valid https URL and drops the trailing slash', () => {
    expect(resolveApiBaseUrl('https://api.example.com/')).toBe('https://api.example.com')
  })

  it('rejects a missing value', () => {
    expect(() => resolveApiBaseUrl(undefined)).toThrow(ConfigurationError)
  })

  it('rejects a relative URL', () => {
    expect(() => resolveApiBaseUrl('/api')).toThrow(ConfigurationError)
  })

  it('rejects a disallowed protocol', () => {
    expect(() => resolveApiBaseUrl('ftp://localhost:5078')).toThrow(ConfigurationError)
  })

  it('rejects embedded username/password credentials', () => {
    expect(() => resolveApiBaseUrl('https://usuario:senha@api.example.com')).toThrow(
      ConfigurationError,
    )
  })

  it('rejects a query string', () => {
    expect(() => resolveApiBaseUrl('https://api.example.com?x=1')).toThrow(ConfigurationError)
  })

  it('rejects a fragment', () => {
    expect(() => resolveApiBaseUrl('https://api.example.com/#fragmento')).toThrow(
      ConfigurationError,
    )
  })

  it('rejects an application path beyond the origin', () => {
    expect(() => resolveApiBaseUrl('https://api.example.com/base')).toThrow(ConfigurationError)
  })

  it('never echoes the raw invalid value in the error message', () => {
    try {
      resolveApiBaseUrl('https://minhaconta:segredo123xyz@api.example.com')
      expect.unreachable()
    } catch (error) {
      expect((error as Error).message).not.toContain('minhaconta')
      expect((error as Error).message).not.toContain('segredo123xyz')
    }
  })
})
