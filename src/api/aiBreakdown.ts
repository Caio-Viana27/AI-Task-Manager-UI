import { useMutation } from '@tanstack/react-query'
import { apiRequest } from './client.ts'
import type { TaskComplexity, TaskPriority } from './tasks.ts'

/** One AI-drafted subtask (PLAN §5, Breakdown). Nothing is saved until the user creates it. */
export interface SubtaskDraft {
  title: string
  description: string
  priority: TaskPriority
  complexity: TaskComplexity
}

/** `POST /tasks/{id}/ai/breakdown`: 2–8 drafts, in suggested order. */
export function breakdownTask(taskId: string): Promise<SubtaskDraft[]> {
  return apiRequest<SubtaskDraft[]>(`/v1/tasks/${encodeURIComponent(taskId)}/ai/breakdown`, { method: 'POST' })
}

/**
 * A mutation, not a query (wave 3, D9): each call costs AI quota, so it is never cached and
 * never retried on its own.
 */
export function useBreakdownTask() {
  return useMutation({ mutationFn: breakdownTask, retry: false })
}
