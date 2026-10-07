import {
  TASK_COMPLEXITIES,
  TASK_PRIORITIES,
  TASK_SORT_FIELDS,
  TASK_STATUSES,
  type IsoDate,
  type TaskComplexity,
  type TaskFilters,
  type TaskPriority,
  type TaskSort,
  type TaskStatus,
} from '../../../api/tasks.ts'

/** Tasks per dashboard page. */
export const DASHBOARD_PAGE_SIZE = 20

/** PLAN §4's default sort. Left out of the URL. */
export const DEFAULT_SORT: TaskSort = 'dueDate,asc'

/** D8: the API rejects a longer `q`. */
export const MAX_SEARCH_LENGTH = 100

export const SORT_OPTIONS: readonly TaskSort[] = TASK_SORT_FIELDS.flatMap((field) => [
  `${field},asc` as const,
  `${field},desc` as const,
])

/**
 * The dashboard's filters, sort and page as held in the URL. Every field is already valid:
 * `parseDashboardParams` drops what isn't.
 */
export interface DashboardState {
  status: TaskStatus[]
  priority: TaskPriority[]
  complexity: TaskComplexity[]
  dueFrom?: IsoDate
  dueTo?: IsoDate
  /** Trimmed and non-blank. */
  q?: string
  includeSubtasks: boolean
  sort: TaskSort
  /** One-based, as shown to the user. The API's `page` is this minus one. */
  page: number
}

export const EMPTY_DASHBOARD_STATE: DashboardState = {
  status: [],
  priority: [],
  complexity: [],
  includeSubtasks: false,
  sort: DEFAULT_SORT,
  page: 1,
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** A real calendar date as `YYYY-MM-DD`, checked without `Date` so no time zone is involved. */
export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value)
  if (!match) {
    return false
  }
  const [year, month, day] = match.slice(1).map(Number)
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1]
}

/** The values of a repeated parameter that are in `allowed`, deduplicated and in `allowed`'s order. */
function pickAll<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[]): T[] {
  const values = new Set(params.getAll(key))
  return allowed.filter((value) => values.has(value))
}

function pickDate(params: URLSearchParams, key: string): IsoDate | undefined {
  const value = params.get(key)
  return value !== null && isIsoDate(value) ? value : undefined
}

function pickQuery(params: URLSearchParams): string | undefined {
  const q = params.get('q')?.trim()
  return q && q.length <= MAX_SEARCH_LENGTH ? q : undefined
}

function pickSort(params: URLSearchParams): TaskSort {
  const sort = params.get('sort')
  return SORT_OPTIONS.find((option) => option === sort) ?? DEFAULT_SORT
}

function pickPage(params: URLSearchParams): number {
  const page = params.get('page')
  return page !== null && /^[1-9]\d{0,5}$/.test(page) ? Number(page) : 1
}

/** Reads the dashboard state from the URL. Invalid or unknown values are dropped, never sent. */
export function parseDashboardParams(params: URLSearchParams): DashboardState {
  return {
    status: pickAll(params, 'status', TASK_STATUSES),
    priority: pickAll(params, 'priority', TASK_PRIORITIES),
    complexity: pickAll(params, 'complexity', TASK_COMPLEXITIES),
    dueFrom: pickDate(params, 'dueFrom'),
    dueTo: pickDate(params, 'dueTo'),
    q: pickQuery(params),
    includeSubtasks: params.get('includeSubtasks') === 'true',
    sort: pickSort(params),
    page: pickPage(params),
  }
}

/** The URL form of the state. Defaults (no filter, default sort, page 1) are left out. */
export function toDashboardParams(state: DashboardState): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of ['status', 'priority', 'complexity'] as const) {
    for (const value of state[key]) {
      params.append(key, value)
    }
  }
  if (state.dueFrom) {
    params.set('dueFrom', state.dueFrom)
  }
  if (state.dueTo) {
    params.set('dueTo', state.dueTo)
  }
  if (state.q) {
    params.set('q', state.q)
  }
  if (state.includeSubtasks) {
    params.set('includeSubtasks', 'true')
  }
  if (state.sort !== DEFAULT_SORT) {
    params.set('sort', state.sort)
  }
  if (state.page > 1) {
    params.set('page', String(state.page))
  }
  return params
}

/** The `GET /tasks` filters for the state, with a zero-based page and an explicit size and sort. */
export function toTaskFilters(state: DashboardState): TaskFilters {
  return {
    ...(state.status.length > 0 && { status: state.status }),
    ...(state.priority.length > 0 && { priority: state.priority }),
    ...(state.complexity.length > 0 && { complexity: state.complexity }),
    ...(state.dueFrom && { dueFrom: state.dueFrom }),
    ...(state.dueTo && { dueTo: state.dueTo }),
    ...(state.q && { q: state.q }),
    ...(state.includeSubtasks && { includeSubtasks: true }),
    page: state.page - 1,
    size: DASHBOARD_PAGE_SIZE,
    sort: state.sort,
  }
}

/** Whether any filter narrows the list. Sort and page don't count. */
export function hasActiveFilters(state: DashboardState): boolean {
  return (
    state.status.length > 0 ||
    state.priority.length > 0 ||
    state.complexity.length > 0 ||
    state.dueFrom !== undefined ||
    state.dueTo !== undefined ||
    state.q !== undefined ||
    state.includeSubtasks
  )
}
