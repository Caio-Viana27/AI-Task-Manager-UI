import { describe, expect, it } from 'vitest'
import {
  EMPTY_DASHBOARD_STATE,
  hasActiveFilters,
  isIsoDate,
  parseDashboardParams,
  toDashboardParams,
  toTaskFilters,
} from './dashboardParams.ts'
import { formatDueDate } from './formatDueDate.ts'

function parse(query: string) {
  return parseDashboardParams(new URLSearchParams(query))
}

describe('isIsoDate', () => {
  it.each(['2026-10-31', '2024-02-29', '2000-02-29'])('accepts %s', (value) => {
    expect(isIsoDate(value)).toBe(true)
  })

  it.each(['2026-02-29', '1900-02-29', '2026-13-01', '2026-00-10', '2026-04-31', '2026-1-01', '31/10/2026', ''])(
    'rejects %s',
    (value) => {
      expect(isIsoDate(value)).toBe(false)
    },
  )
})

describe('parseDashboardParams', () => {
  it('returns the defaults for an empty query', () => {
    expect(parse('')).toEqual(EMPTY_DASHBOARD_STATE)
  })

  it('reads every valid parameter', () => {
    expect(
      parse(
        'status=OVERDUE&status=TODO&priority=HIGH&complexity=EASY&dueFrom=2026-10-01&dueTo=2026-10-31' +
          '&q=%20report%20&includeSubtasks=true&sort=priority,desc&page=3',
      ),
    ).toEqual({
      status: ['TODO', 'OVERDUE'],
      priority: ['HIGH'],
      complexity: ['EASY'],
      dueFrom: '2026-10-01',
      dueTo: '2026-10-31',
      q: 'report',
      includeSubtasks: true,
      sort: 'priority,desc',
      page: 3,
    })
  })

  it('drops invalid values and keeps the valid ones', () => {
    expect(
      parse(
        'status=OPEN&status=DONE&status=DONE&priority=low&complexity=&dueFrom=2026-02-30&dueTo=tomorrow' +
          `&q=${'x'.repeat(101)}&includeSubtasks=yes&sort=status,asc&page=0`,
      ),
    ).toEqual({ ...EMPTY_DASHBOARD_STATE, status: ['DONE'] })
  })

  it.each(['-1', '1.5', 'abc', '0', '9999999'])('drops page=%s', (page) => {
    expect(parse(`page=${page}`).page).toBe(1)
  })

  it('drops a blank search', () => {
    expect(parse('q=%20%20').q).toBeUndefined()
  })
})

describe('toDashboardParams', () => {
  it('leaves the defaults out', () => {
    expect(toDashboardParams(EMPTY_DASHBOARD_STATE).toString()).toBe('')
  })

  it('round-trips through parseDashboardParams', () => {
    const query = 'status=TODO&status=DONE&priority=LOW&dueFrom=2026-10-01&q=a+b&includeSubtasks=true&sort=title%2Casc&page=2'
    expect(toDashboardParams(parse(query)).toString()).toBe(query)
  })
})

describe('toTaskFilters', () => {
  it('sends a zero-based page, the page size and the sort, and no empty filter', () => {
    expect(toTaskFilters(EMPTY_DASHBOARD_STATE)).toEqual({ page: 0, size: 20, sort: 'dueDate,asc' })
  })

  it('sends every set filter', () => {
    expect(toTaskFilters(parse('status=DONE&complexity=HARD&dueTo=2026-10-31&q=x&includeSubtasks=true&page=4'))).toEqual({
      status: ['DONE'],
      complexity: ['HARD'],
      dueTo: '2026-10-31',
      q: 'x',
      includeSubtasks: true,
      page: 3,
      size: 20,
      sort: 'dueDate,asc',
    })
  })
})

describe('hasActiveFilters', () => {
  it('ignores the sort and the page', () => {
    expect(hasActiveFilters(parse('sort=title,asc&page=2'))).toBe(false)
  })

  it.each(['status=TODO', 'priority=LOW', 'complexity=EASY', 'dueFrom=2026-10-01', 'dueTo=2026-10-01', 'q=a', 'includeSubtasks=true'])(
    'is true with %s',
    (query) => {
      expect(hasActiveFilters(parse(query))).toBe(true)
    },
  )
})

describe('formatDueDate', () => {
  it('formats the date in the given language without shifting the day', () => {
    expect(formatDueDate('2026-10-31', 'en')).toBe('Oct 31, 2026')
    expect(formatDueDate('2026-01-01', 'pt-BR')).toBe('1 de jan. de 2026')
  })

  it('returns anything that is not a date as is', () => {
    expect(formatDueDate('soon', 'en')).toBe('soon')
  })
})
