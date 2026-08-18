import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearStoredRefreshToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
} from './tokenStorage'

describe('tokenStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when nothing is stored', () => {
    expect(getStoredRefreshToken()).toBeNull()
  })

  it('stores and retrieves a refresh token', () => {
    setStoredRefreshToken('refresh-abc')
    expect(getStoredRefreshToken()).toBe('refresh-abc')
  })

  it('clears the stored refresh token', () => {
    setStoredRefreshToken('refresh-abc')
    clearStoredRefreshToken()
    expect(getStoredRefreshToken()).toBeNull()
  })

  it('treats a getItem failure as no token available, without throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })

    expect(() => getStoredRefreshToken()).not.toThrow()
    expect(getStoredRefreshToken()).toBeNull()
  })

  it('swallows a setItem failure without throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    })

    expect(() => setStoredRefreshToken('refresh-abc')).not.toThrow()
  })

  it('swallows a removeItem failure without throwing', () => {
    setStoredRefreshToken('refresh-abc')
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })

    expect(() => clearStoredRefreshToken()).not.toThrow()
  })
})
