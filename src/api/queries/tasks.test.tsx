import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { jsonResponse, stubFetch } from '../../test/fetchMock.ts'
import { createTestQueryClient } from '../../test/renderRoute.tsx'
import type { Task, TaskDetail } from '../tasks.ts'
import {
  taskKeys,
  useCreateSubtasks,
  useCreateTask,
  useDeleteTask,
  useLookups,
  usePatchTask,
  useTask,
  useTasks,
} from './tasks.ts'

const ROOT = 'root-id'
const PARENT = 'parent-id'
const CHILD = 'child-id'

function task(id: string, parentTaskId: string | null): Task {
  return {
    id,
    title: id,
    description: 'd',
    dueDate: null,
    priority: 'MEDIUM',
    status: 'TODO',
    complexity: null,
    parentTaskId,
    createdAt: '2026-10-07T12:00:00Z',
    updatedAt: '2026-10-07T12:00:00Z',
  }
}

function detail(id: string, parentTaskId: string | null): TaskDetail {
  return { ...task(id, parentTaskId), ancestors: [], canAddSubtasks: true, subtasks: [] }
}

function setup() {
  const queryClient = createTestQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

/** Seeds a list, the root, the parent and the child, all fresh. */
function seed(queryClient: QueryClient) {
  queryClient.setQueryData(taskKeys.list({}), { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })
  queryClient.setQueryData(taskKeys.list({ status: ['DONE'] }), { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })
  queryClient.setQueryData(taskKeys.detail(ROOT), detail(ROOT, null))
  queryClient.setQueryData(taskKeys.detail(PARENT), detail(PARENT, ROOT))
  queryClient.setQueryData(taskKeys.detail(CHILD), detail(CHILD, PARENT))
}

function isStale(queryClient: QueryClient, key: readonly unknown[]) {
  return queryClient.getQueryState(key)?.isInvalidated ?? false
}

describe('task query keys', () => {
  it('match the documented shapes', () => {
    expect(taskKeys.lists()).toEqual(['tasks'])
    expect(taskKeys.list({ page: 1 })).toEqual(['tasks', { page: 1 }])
    expect(taskKeys.detail('x')).toEqual(['task', 'x'])
    expect(taskKeys.lookups()).toEqual(['lookups'])
  })
})

describe('task queries', () => {
  it('useTasks fetches the list for the filters', async () => {
    const page = { content: [task(ROOT, null)], page: 0, size: 20, totalElements: 1, totalPages: 1 }
    const fetchMock = stubFetch(() => jsonResponse(page))
    const { wrapper } = setup()

    const { result } = renderHook(() => useTasks({ status: ['TODO'] }), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual(page))
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/tasks?status=TODO')
  })

  it('useTask stays idle without an id', () => {
    const fetchMock = stubFetch(() => jsonResponse({}))
    const { wrapper } = setup()

    const { result } = renderHook(() => useTask(undefined), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('useLookups fetches once and never goes stale', async () => {
    const lookups = { priorities: ['LOW'], statuses: ['TODO'], complexities: ['EASY'] }
    const fetchMock = stubFetch(() => jsonResponse(lookups))
    const { wrapper } = setup()

    const first = renderHook(() => useLookups(), { wrapper })
    await waitFor(() => expect(first.result.current.data).toEqual(lookups))
    const second = renderHook(() => useLookups(), { wrapper })

    expect(second.result.current.data).toEqual(lookups)
    expect(second.result.current.isStale).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('task mutations', () => {
  it('create invalidates every list', async () => {
    stubFetch(() => jsonResponse(task('new', null), 201))
    const { queryClient, wrapper } = setup()
    seed(queryClient)

    const { result } = renderHook(() => useCreateTask(), { wrapper })
    await result.current.mutateAsync({ title: 't', description: 'd' })

    expect(isStale(queryClient, taskKeys.list({}))).toBe(true)
    expect(isStale(queryClient, taskKeys.list({ status: ['DONE'] }))).toBe(true)
    expect(isStale(queryClient, taskKeys.detail(ROOT))).toBe(false)
  })

  it('patch invalidates the lists, the task and its parent', async () => {
    stubFetch(() => jsonResponse({ ...task(CHILD, PARENT), status: 'DONE' }))
    const { queryClient, wrapper } = setup()
    seed(queryClient)

    const { result } = renderHook(() => usePatchTask(), { wrapper })
    await result.current.mutateAsync({ id: CHILD, patch: { status: 'DONE' } })

    expect(isStale(queryClient, taskKeys.list({}))).toBe(true)
    expect(isStale(queryClient, taskKeys.detail(CHILD))).toBe(true)
    expect(isStale(queryClient, taskKeys.detail(PARENT))).toBe(true)
    expect(isStale(queryClient, taskKeys.detail(ROOT))).toBe(false)
  })

  it('delete removes the task query and invalidates the lists, the parent and its parent', async () => {
    const fetchMock = stubFetch(() => new Response(null, { status: 204 }))
    const { queryClient, wrapper } = setup()
    seed(queryClient)

    const { result } = renderHook(() => useDeleteTask(), { wrapper })
    await result.current.mutateAsync({ id: CHILD })

    expect(fetchMock.mock.calls[0][1]?.method).toBe('DELETE')
    expect(queryClient.getQueryState(taskKeys.detail(CHILD))).toBeUndefined()
    expect(isStale(queryClient, taskKeys.list({}))).toBe(true)
    expect(isStale(queryClient, taskKeys.detail(PARENT))).toBe(true)
    expect(isStale(queryClient, taskKeys.detail(ROOT))).toBe(true)
  })

  it('delete of a top-level task invalidates only the lists', async () => {
    stubFetch(() => new Response(null, { status: 204 }))
    const { queryClient, wrapper } = setup()
    seed(queryClient)

    const { result } = renderHook(() => useDeleteTask(), { wrapper })
    await result.current.mutateAsync({ id: ROOT, parentTaskId: null })

    expect(queryClient.getQueryState(taskKeys.detail(ROOT))).toBeUndefined()
    expect(isStale(queryClient, taskKeys.list({}))).toBe(true)
    expect(isStale(queryClient, taskKeys.detail(PARENT))).toBe(false)
  })

  it('subtask create invalidates the lists, the parent and its parent', async () => {
    stubFetch(() => jsonResponse([task('new', PARENT)], 201))
    const { queryClient, wrapper } = setup()
    seed(queryClient)

    const { result } = renderHook(() => useCreateSubtasks(), { wrapper })
    await result.current.mutateAsync({ parentId: PARENT, subtasks: [{ title: 't', description: 'd' }] })

    expect(isStale(queryClient, taskKeys.list({}))).toBe(true)
    expect(isStale(queryClient, taskKeys.detail(PARENT))).toBe(true)
    expect(isStale(queryClient, taskKeys.detail(ROOT))).toBe(true)
    expect(isStale(queryClient, taskKeys.detail(CHILD))).toBe(false)
  })
})
