import { isIsoDate } from './dashboardParams.ts'

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
