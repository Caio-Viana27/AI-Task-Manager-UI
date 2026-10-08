import { useMutation } from '@tanstack/react-query'
import { apiRequest } from './client.ts'
import type { TaskComplexity, TaskPriority } from './tasks.ts'

/**
 * The AI's review of a saved task (wave 4, D11, D13). The API has already checked the lookup
 * names, the hours (a whole number, 1–999) and the reason. Nothing is saved.
 */
export interface TaskAnalysis {
  priority: TaskPriority
  complexity: TaskComplexity
  estimatedHours: number
  /** Plain text in the request language. */
  reason: string
}

/** `POST /tasks/{id}/ai/analysis`, no body. */
export function analyzeTask(taskId: string): Promise<TaskAnalysis> {
  return apiRequest<TaskAnalysis>(`/v1/tasks/${encodeURIComponent(taskId)}/ai/analysis`, { method: 'POST' })
}

/**
 * A mutation, not a query (wave 3, D9): each call costs AI quota, so it is never cached and
 * never retried on its own.
 */
export function useAnalyzeTask() {
  return useMutation({ mutationFn: analyzeTask, retry: false })
}
