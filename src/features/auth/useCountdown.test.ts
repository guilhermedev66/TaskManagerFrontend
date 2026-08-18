import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down one second at a time, never going negative', async () => {
    const { result } = renderHook(() => useCountdown(2))

    expect(result.current).toBe(2)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(result.current).toBe(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(result.current).toBe(0)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(result.current).toBe(0)
  })

  it('returns undefined when there is nothing to count down', async () => {
    const { result } = renderHook(() => useCountdown(undefined))

    expect(result.current).toBeUndefined()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })
    expect(result.current).toBeUndefined()
  })

  it('resets when initialSeconds changes', async () => {
    const { result, rerender } = renderHook(({ seconds }) => useCountdown(seconds), {
      initialProps: { seconds: 5 },
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(result.current).toBe(4)

    rerender({ seconds: 10 })
    expect(result.current).toBe(10)
  })
})
