import { describe, expect, it } from 'vitest'
import { formatDueDate, formatDueDateShort, relativeDueDay } from './formatDueDate.ts'

const TODAY = '2026-10-08'

describe('formatDueDate', () => {
  it('formats in the reader’s language without shifting the day', () => {
    expect(formatDueDate('2026-10-31', 'en')).toBe('Oct 31, 2026')
    expect(formatDueDate('2026-10-31', 'pt-BR')).toBe('31 de out. de 2026')
    expect(formatDueDate('not a date', 'en')).toBe('not a date')
  })
})

describe('relativeDueDay', () => {
  it.each([
    ['2026-10-08', 'today'],
    ['2026-10-09', 'tomorrow'],
    ['2026-10-07', undefined],
    ['2026-10-10', undefined],
  ] as const)('%s is %s', (date, expected) => {
    expect(relativeDueDay(date, TODAY)).toBe(expected)
  })

  it('crosses a year boundary', () => {
    expect(relativeDueDay('2027-01-01', '2026-12-31')).toBe('tomorrow')
  })
})

describe('formatDueDateShort', () => {
  it('leaves the year out for this year', () => {
    expect(formatDueDateShort('2026-10-09', 'en', TODAY)).toBe('Oct 9')
    expect(formatDueDateShort('2026-10-09', 'pt-BR', TODAY)).toBe('9 de out.')
  })

  it('shows the year for other years', () => {
    expect(formatDueDateShort('2027-01-15', 'en', TODAY)).toBe('Jan 15, 2027')
    expect(formatDueDateShort('2025-12-31', 'pt-BR', TODAY)).toBe('31 de dez. de 2025')
  })

  it('returns anything that isn’t a date as is', () => {
    expect(formatDueDateShort('soon', 'en', TODAY)).toBe('soon')
  })
})
