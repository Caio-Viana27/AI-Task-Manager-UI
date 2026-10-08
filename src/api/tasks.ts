import { apiRequest } from './client.ts'

/** Lookup names in seed order (PLAN §2). The API resolves names to IDs; IDs never reach the UI. */
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'OVERDUE', 'DONE'] as const
export const TASK_COMPLEXITIES = ['EASY', 'MEDIUM', 'HARD'] as const

export type TaskPriority = (typeof TASK_PRIORITIES)[number]
export type TaskStatus = (typeof TASK_STATUSES)[number]
export type TaskComplexity = (typeof TASK_COMPLEXITIES)[number]

/** The statuses a user may send. `OVERDUE` is set only by the system (PLAN §2, Status rules). */
export const USER_SETTABLE_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const satisfies readonly TaskStatus[]
export type UserSettableStatus = (typeof USER_SETTABLE_STATUSES)[number]

/** A due date as `YYYY-MM-DD`. Never parse it with `new Date()`, which shifts it by time zone (D6). */
export type IsoDate = string

/** One step of the breadcrumb path, root first (PLAN §2). */
export interface AncestorSummary {
  id: string
  title: string
}

/** A direct child as listed on its parent's detail page (PLAN §2, SubtaskSummary). */
export interface SubtaskSummary {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: IsoDate | null
  /** Number of the subtask's own direct children. */
  subtaskCount: number
}

/**
 * The task object (PLAN §2). `ancestors`, `canAddSubtasks` and `subtasks` are present only
 * in `GET /tasks/{id}`; list and write responses leave them out.
 */
export interface Task {
  id: string
  title: string
  description: string
  dueDate: IsoDate | null
  priority: TaskPriority
  status: TaskStatus
  complexity: TaskComplexity | null
  /** Estimated effort in whole hours, 1–999, or `null` when not estimated (wave 4, D10). */
  estimatedHours: number | null
  parentTaskId: string | null
  ancestors?: AncestorSummary[]
  canAddSubtasks?: boolean
  subtasks?: SubtaskSummary[]
  /** ISO-8601 instant. */
  createdAt: string
  /** ISO-8601 instant. */
  updatedAt: string
}

/** A task as returned by `GET /tasks/{id}`, with the detail-only fields. */
export type TaskDetail = Task & Required<Pick<Task, 'ancestors' | 'canAddSubtasks' | 'subtasks'>>

/** Page response of `GET /tasks` (PLAN §4). `page` is zero-based. */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export const TASK_SORT_FIELDS = ['dueDate', 'priority', 'createdAt', 'title'] as const
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number]
export type SortDirection = 'asc' | 'desc'
/** A `sort` value such as `dueDate,asc`. */
export type TaskSort = `${TaskSortField},${SortDirection}`

/** Query parameters of `GET /tasks` (PLAN §4). Absent or empty values aren't sent. */
export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  complexity?: TaskComplexity[]
  /** Inclusive. */
  dueFrom?: IsoDate
  /** Inclusive. */
  dueTo?: IsoDate
  /** Trimmed; blank means no text filter (D8). */
  q?: string
  /** `false` (the API default) lists only top-level tasks. */
  includeSubtasks?: boolean
  /** Zero-based. */
  page?: number
  size?: number
  sort?: TaskSort
}

/** Response of `GET /lookups`: names in seed order (D3). */
export interface Lookups {
  priorities: TaskPriority[]
  statuses: TaskStatus[]
  complexities: TaskComplexity[]
}

/**
 * Body of `POST /tasks`, and one item of `POST /tasks/{id}/subtasks` (PLAN §4).
 * `estimatedHours` is accepted only by `POST /tasks`, never on subtask create (wave 4, D10).
 */
export interface CreateTaskRequest {
  title: string
  description: string
  dueDate?: IsoDate | null
  priority?: TaskPriority
  complexity?: TaskComplexity | null
  estimatedHours?: number | null
}

/** Body of `PUT /tasks/{id}`: every editable field. */
export interface UpdateTaskRequest {
  title: string
  description: string
  dueDate: IsoDate | null
  priority: TaskPriority
  status: UserSettableStatus
  complexity: TaskComplexity | null
  estimatedHours?: number | null
}

/**
 * Body of `PATCH /tasks/{id}` (D2). A field left `undefined` isn't sent and stays unchanged;
 * `null` is sent and clears it, which only `dueDate`, `complexity` and `estimatedHours` accept.
 */
export interface PatchTaskRequest {
  title?: string
  description?: string
  dueDate?: IsoDate | null
  priority?: TaskPriority
  status?: UserSettableStatus
  complexity?: TaskComplexity | null
  estimatedHours?: number | null
}

/**
 * The query string for `GET /tasks`, with a leading `?`, or `''` when there is nothing to send.
 * Array filters repeat their parameter (`status=TODO&status=OVERDUE`).
 */
export function buildTaskQuery(filters: TaskFilters = {}): string {
  const params = new URLSearchParams()
  for (const key of ['status', 'priority', 'complexity'] as const) {
    for (const value of filters[key] ?? []) {
      params.append(key, value)
    }
  }
  if (filters.dueFrom) {
    params.set('dueFrom', filters.dueFrom)
  }
  if (filters.dueTo) {
    params.set('dueTo', filters.dueTo)
  }
  const q = filters.q?.trim()
  if (q) {
    params.set('q', q)
  }
  if (filters.includeSubtasks) {
    params.set('includeSubtasks', 'true')
  }
  if (filters.page !== undefined) {
    params.set('page', String(filters.page))
  }
  if (filters.size !== undefined) {
    params.set('size', String(filters.size))
  }
  if (filters.sort) {
    params.set('sort', filters.sort)
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

/** Drops the `undefined` fields of a patch and keeps explicit `null`s (D2). */
export function toPatchBody(patch: PatchTaskRequest): PatchTaskRequest {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as PatchTaskRequest
}

const TASKS_PATH = '/v1/tasks'

function taskPath(id: string): string {
  return `${TASKS_PATH}/${encodeURIComponent(id)}`
}

export function listTasks(filters: TaskFilters = {}, signal?: AbortSignal): Promise<PageResponse<Task>> {
  return apiRequest<PageResponse<Task>>(`${TASKS_PATH}${buildTaskQuery(filters)}`, { signal })
}

export function getTask(id: string, signal?: AbortSignal): Promise<TaskDetail> {
  return apiRequest<TaskDetail>(taskPath(id), { signal })
}

export function createTask(request: CreateTaskRequest): Promise<Task> {
  return apiRequest<Task>(TASKS_PATH, { method: 'POST', body: request })
}

export function updateTask(id: string, request: UpdateTaskRequest): Promise<Task> {
  return apiRequest<Task>(taskPath(id), { method: 'PUT', body: request })
}

export function patchTask(id: string, patch: PatchTaskRequest): Promise<Task> {
  return apiRequest<Task>(taskPath(id), { method: 'PATCH', body: toPatchBody(patch) })
}

/** Deletes the task and its whole subtree (PLAN §4). */
export async function deleteTask(id: string): Promise<void> {
  await apiRequest<undefined>(taskPath(id), { method: 'DELETE' })
}

/** Creates 1–10 subtasks under `parentId`, returned in request order (PLAN §4). */
export function createSubtasks(parentId: string, subtasks: CreateTaskRequest[]): Promise<Task[]> {
  return apiRequest<Task[]>(`${taskPath(parentId)}/subtasks`, { method: 'POST', body: subtasks })
}

export function getLookups(signal?: AbortSignal): Promise<Lookups> {
  return apiRequest<Lookups>('/v1/lookups', { signal })
}
