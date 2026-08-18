import { describe, expect, it } from 'vitest'
import { buildPaginationItems } from './paginationModel'

describe('buildPaginationItems', () => {
  it('returns [1] when there is only one page', () => {
    expect(buildPaginationItems(1, 1)).toEqual([1])
  })

  it('shows every page when totalPages <= 7 (no ellipsis)', () => {
    expect(buildPaginationItems(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(buildPaginationItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('shows first, last, and a window around the current page with ellipses on both sides', () => {
    expect(buildPaginationItems(9, 42)).toEqual([1, 'ellipsis', 8, 9, 10, 'ellipsis', 42])
  })

  it('omits the leading ellipsis when the current page is near the start', () => {
    expect(buildPaginationItems(2, 10)).toEqual([1, 2, 3, 'ellipsis', 10])
  })

  it('omits the trailing ellipsis when the current page is near the end', () => {
    expect(buildPaginationItems(10, 10)).toEqual([1, 'ellipsis', 9, 10])
  })

  it('never shows an ellipsis that hides only a single page (shows the number instead)', () => {
    // totalPages=9, current=3: windowStart=2, windowEnd=4 -> gap before 2 is none (2>2 false)
    expect(buildPaginationItems(3, 9)).toEqual([1, 2, 3, 4, 'ellipsis', 9])
  })
})
