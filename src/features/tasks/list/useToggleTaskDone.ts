import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { patchTask, type PageResponse, type Task, type TaskStatus } from '../../../api/tasks.ts'
import { invalidateTaskUpdate, invalidateTaskWrite, taskKeys } from '../../../api/queries/tasks.ts'

export interface ToggleTaskDoneVariables {
  task: Task
  /** `true` marks the task `DONE`; `false` reopens it as `TODO`. */
  done: boolean
}

/** Applies `change` to task `id` in every cached list page. */
function updateTaskInLists(queryClient: QueryClient, id: string, change: (task: Task) => Task) {
  queryClient.setQueriesData<PageResponse<Task>>({ queryKey: taskKeys.lists() }, (page) =>
    page && Array.isArray(page.content)
      ? { ...page, content: page.content.map((task) => (task.id === id ? change(task) : task)) }
      : page,
  )
}

/**
 * The list's quick done/undone toggle: `PATCH { status }` with an optimistic update. On error
 * only this task's status is rolled back, so concurrent toggles of other rows survive. On success
 * the row takes the status from the response, which may be `OVERDUE` (D4). Marking a task done
 * also completes its subtree (D9), so every cached task is then refreshed.
 */
export function useToggleTaskDone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ task, done }: ToggleTaskDoneVariables) => patchTask(task.id, { status: done ? 'DONE' : 'TODO' }),
    onMutate: async ({ task, done }): Promise<{ previousStatus: TaskStatus }> => {
      // A list fetch that lands after the optimistic write would overwrite it.
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })
      updateTaskInLists(queryClient, task.id, (cached) => ({ ...cached, status: done ? 'DONE' : 'TODO' }))
      return { previousStatus: task.status }
    },
    onError: (_error, { task }, context) => {
      if (context) {
        updateTaskInLists(queryClient, task.id, (cached) => ({ ...cached, status: context.previousStatus }))
      }
    },
    onSuccess: (updated) => {
      updateTaskInLists(queryClient, updated.id, (cached) => ({ ...cached, ...updated }))
    },
    onSettled: (updated, _error, { task }) => {
      void (updated
        ? invalidateTaskUpdate(queryClient, updated)
        : invalidateTaskWrite(queryClient, task.id, task.parentTaskId))
    },
  })
}
