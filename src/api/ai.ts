import { useMutation } from '@tanstack/react-query'
import { apiRequest } from './client.ts'
import type { TaskComplexity, TaskPriority } from './tasks.ts'

/** Body of `POST /ai/suggest` (PLAN §5): trimmed, within the task limits. */
export interface SuggestRequest {
  title: string
  description: string
}

/** The AI's suggestion (PLAN §5). The API has already checked the limits and lookup names. */
export interface SuggestResponse {
  suggestedTitle: string
  suggestedDescription: string
  suggestedPriority: TaskPriority
  suggestedComplexity: TaskComplexity
  reasoning: string
}

export function suggestTask(request: SuggestRequest): Promise<SuggestResponse> {
  return apiRequest<SuggestResponse>('/v1/ai/suggest', { method: 'POST', body: request })
}

/**
 * A mutation, not a query (wave 3, D9): each call costs AI quota, so it is never cached and
 * never retried on its own.
 */
export function useSuggestTask() {
  return useMutation({ mutationFn: suggestTask, retry: false })
}
