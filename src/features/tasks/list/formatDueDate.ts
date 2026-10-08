import { isIsoDate } from './dashboardParams.ts'
import { addDays } from './dates.ts'

/**
 * A `YYYY-MM-DD` due date in the reader's language, e.g. "Oct 31, 2026". Built from the date's
 * parts and formatted in UTC, so no time zone can shift the day (D6). Anything else is returned as is.
 */
export function formatDueDate(date: string, language: string): string {
  if (!isIsoDate(date)) {
    return date
  }
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    Date.UTC(year, month - 1, day),
  )
}

/** `'today'` or `'tomorrow'` when the due date is one of those days, from `today` (both `YYYY-MM-DD`). */
export function relativeDueDay(date: string, today: string): 'today' | 'tomorrow' | undefined {
  if (date === today) {
    return 'today'
  }
  return date === addDays(today, 1) ? 'tomorrow' : undefined
}

/**
 * A due date for the task table: day and short month ("Oct 9", "9 de out."), with the year only
 * when it isn't `today`'s year. Formatted in UTC like `formatDueDate`, so the day never shifts.
 */
export function formatDueDateShort(date: string, language: string, today: string): string {
  if (!isIsoDate(date)) {
    return date
  }
  const [year, month, day] = date.split('-').map(Number)
  const sameYear = today.startsWith(`${year}-`)
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    ...(!sameYear && { year: 'numeric' }),
    timeZone: 'UTC',
  }).format(Date.UTC(year, month - 1, day))
}
