import type { IsoDate } from '../../../api/tasks.ts'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Today in the reader's local calendar as `YYYY-MM-DD`, built from the date's local parts.
 * Never from `toISOString()`, which would give the UTC day.
 */
export function todayIso(now: Date = new Date()): IsoDate {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** `date` moved by `days` (negative goes back). The arithmetic runs in UTC, so no time zone can shift it (D6). */
export function addDays(date: IsoDate, days: number): IsoDate {
  const [year, month, day] = date.split('-').map(Number)
  const moved = new Date(Date.UTC(year, month - 1, day + days))
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}`
}
