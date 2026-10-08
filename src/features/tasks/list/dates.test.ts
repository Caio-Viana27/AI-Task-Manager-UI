import { describe, expect, it } from 'vitest'
import { addDays, todayIso } from './dates.ts'

describe('todayIso', () => {
  it('uses the local calendar day, zero-padded', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(todayIso(new Date(2026, 9, 8, 0, 1))).toBe('2026-10-08')
  })
})

describe('addDays', () => {
  it.each([
    ['2026-10-08', 1, '2026-10-09'],
    ['2026-10-31', 1, '2026-11-01'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2026-03-01', -1, '2026-02-28'],
    ['2026-10-08', 7, '2026-10-15'],
    ['2026-10-08', 0, '2026-10-08'],
  ])('%s + %i = %s', (date, days, expected) => {
    expect(addDays(date, days)).toBe(expected)
  })
})
