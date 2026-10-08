import { useMutation } from '@tanstack/react-query'
import { apiRequest } from './client.ts'

/** One turn of a chat, as `history` sends it (wave 4, D2). */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Body of `POST /ai/chat` (PLAN §5): `message` ≤ 1000 characters, at most 10 `history` items, oldest first. */
export interface ChatRequest {
  message: string
  history: ChatMessage[]
}

/** The assistant's plain-text reply, at most 2000 characters (wave 4, D3). */
export interface ChatResponse {
  reply: string
}

export function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/v1/ai/chat', { method: 'POST', body: request })
}

/**
 * A mutation, not a query (wave 3, D9): each call costs AI quota, so it is never cached and
 * never retried on its own.
 */
export function useSendChatMessage() {
  return useMutation({ mutationFn: sendChatMessage, retry: false })
}
