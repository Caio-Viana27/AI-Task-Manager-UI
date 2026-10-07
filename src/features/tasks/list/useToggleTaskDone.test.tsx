import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { taskKeys } from '../../../api/queries/tasks.ts'
import type { Task, TaskDetail } from '../../../api/tasks.ts'
import { jsonResponse, stubFetch } from '../../../test/fetchMock.ts'
import { createTestQueryClient } from '../../../test/renderRoute.tsx'
import { useToggleTaskDone } from './useToggleTaskDone.ts'

function task(id: string, parentTaskId: string | null, status: Task['status'] = 'TODO'): Task {
  return {
    id,
    title: id,
    description: 'd',
    dueDate: null,
    priority: 'MEDIUM',
    status,
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
  queryClient.setQueryData(taskKeys.detail('root'), detail('root', null))
  queryClient.setQueryData(taskKeys.detail('child'), detail('child', 'root'))
  queryClient.setQueryData(taskKeys.detail('other'), detail('other', null))
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const isStale = (id: string) => queryClient.getQueryState(taskKeys.detail(id))?.isInvalidated ?? false
  return { wrapper, isStale }
}

describe('useToggleTaskDone', () => {
  it('marking done refreshes every cached task, since the subtree is done too (D9)', async () => {
    stubFetch(() => jsonResponse(task('root', null, 'DONE')))
    const { wrapper, isStale } = setup()

    const { result } = renderHook(() => useToggleTaskDone(), { wrapper })
    await result.current.mutateAsync({ task: task('root', null), done: true })

    expect(isStale('child')).toBe(true)
    expect(isStale('other')).toBe(true)
  })

  it('reopening refreshes only the task, not its subtasks', async () => {
    stubFetch(() => jsonResponse(task('root', null, 'TODO')))
    const { wrapper, isStale } = setup()

    const { result } = renderHook(() => useToggleTaskDone(), { wrapper })
    await result.current.mutateAsync({ task: task('root', null, 'DONE'), done: false })

    expect(isStale('root')).toBe(true)
    expect(isStale('child')).toBe(false)
  })
})
