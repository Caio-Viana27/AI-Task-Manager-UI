import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  createSubtasks,
  createTask,
  deleteTask,
  getLookups,
  getTask,
  listTasks,
  patchTask,
  updateTask,
  type CreateTaskRequest,
  type PatchTaskRequest,
  type Task,
  type TaskDetail,
  type TaskFilters,
  type TaskSort,
  type UpdateTaskRequest,
} from '../tasks.ts'

/** Query keys for task data. Every list shares the `['tasks']` prefix, so one call invalidates them all. */
export const taskKeys = {
  lists: () => ['tasks'] as const,
  list: (filters: TaskFilters) => ['tasks', filters] as const,
  /** Prefix of every single-task query. */
  details: () => ['task'] as const,
  detail: (id: string) => ['task', id] as const,
  lookups: () => ['lookups'] as const,
}

export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: ({ signal }) => listTasks(filters, signal),
    // Keep the current page on screen while the next filter or page loads.
    placeholderData: keepPreviousData,
  })
}

/** The filters a count looks at: no page, size or sort. */
export type CountFilters = Omit<TaskFilters, 'page' | 'size' | 'sort'>

/**
 * How many tasks match `filters`, read from `totalElements` of a one-item page. It lives under
 * the lists prefix, so every task write refreshes it.
 */
export function useTaskCount(filters: CountFilters, enabled = true) {
  const request: TaskFilters = { ...filters, page: 0, size: 1 }
  return useQuery({
    queryKey: taskKeys.list(request),
    queryFn: ({ signal }) => listTasks(request, signal),
    select: (page) => page.totalElements,
    enabled,
  })
}

/**
 * The first task of `filters` in `sort` order, or `null` when none match. Used for the
 * assistant's "next step".
 */
export function useFirstTask(filters: CountFilters, sort: TaskSort, enabled = true) {
  const request: TaskFilters = { ...filters, page: 0, size: 1, sort }
  return useQuery({
    queryKey: taskKeys.list(request),
    queryFn: ({ signal }) => listTasks(request, signal),
    select: (page) => page.content[0] ?? null,
    enabled,
  })
}

/** One task with its ancestors and direct subtasks. Disabled while `id` is undefined. */
export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: taskKeys.detail(id ?? ''),
    queryFn: ({ signal }) => getTask(id!, signal),
    enabled: id !== undefined,
  })
}

/** The lookup names never change while the app runs (D3), so they're fetched once. */
export function useLookups() {
  return useQuery({
    queryKey: taskKeys.lookups(),
    queryFn: ({ signal }) => getLookups(signal),
    staleTime: Infinity,
  })
}

/** The parent of a task, as far as the cache knows it. */
function cachedParentId(queryClient: QueryClient, id: string): string | null {
  return queryClient.getQueryData<TaskDetail>(taskKeys.detail(id))?.parentTaskId ?? null
}

/**
 * Marks stale everything a write to task `id` may have changed: every list, the task itself,
 * and its parent, whose subtask summaries show the task.
 */
export function invalidateTaskWrite(queryClient: QueryClient, id: string, parentTaskId: string | null): Promise<void> {
  const keys = [taskKeys.lists(), taskKeys.detail(id), ...(parentTaskId ? [taskKeys.detail(parentTaskId)] : [])]
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))).then(() => undefined)
}

/**
 * Marks stale everything an edit that returned `task` may have changed. Marking a task `DONE`
 * also completes its whole subtree on the server (D9), so every cached task is marked stale too.
 */
export function invalidateTaskUpdate(queryClient: QueryClient, task: Task): Promise<void> {
  if (task.status !== 'DONE') {
    return invalidateTaskWrite(queryClient, task.id, task.parentTaskId)
  }
  const keys = [taskKeys.lists(), taskKeys.details()]
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))).then(() => undefined)
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateTaskRequest) => createTask(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
  })
}

export interface UpdateTaskVariables {
  id: string
  request: UpdateTaskRequest
}

/** `PUT`. The UI edits with `usePatchTask` (D6); this is kept for completeness. */
export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: UpdateTaskVariables) => updateTask(id, request),
    onSuccess: (task: Task) => invalidateTaskUpdate(queryClient, task),
  })
}

export interface PatchTaskVariables {
  id: string
  patch: PatchTaskRequest
}

export function usePatchTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: PatchTaskVariables) => patchTask(id, patch),
    onSuccess: (task: Task) => invalidateTaskUpdate(queryClient, task),
  })
}

export interface DeleteTaskVariables {
  id: string
  /** The deleted task's parent. Falls back to the cached task when left out. */
  parentTaskId?: string | null
}

/**
 * Deletes a task and its subtree. The task's own query is removed, not refetched (it would
 * 404); the lists, the parent, and the parent's parent (whose `subtaskCount` changed) are
 * invalidated.
 */
export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: DeleteTaskVariables) => deleteTask(id),
    onSuccess: async (_data, { id, parentTaskId }) => {
      const parentId = parentTaskId !== undefined ? parentTaskId : cachedParentId(queryClient, id)
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) })
      if (parentId) {
        await invalidateTaskWrite(queryClient, parentId, cachedParentId(queryClient, parentId))
      } else {
        await queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      }
    },
  })
}

export interface CreateSubtasksVariables {
  parentId: string
  subtasks: CreateTaskRequest[]
}

/** Invalidates the lists, the parent, and the parent's parent (whose `subtaskCount` changed). */
export function useCreateSubtasks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ parentId, subtasks }: CreateSubtasksVariables) => createSubtasks(parentId, subtasks),
    onSuccess: (_tasks, { parentId }) =>
      invalidateTaskWrite(queryClient, parentId, cachedParentId(queryClient, parentId)),
  })
}
