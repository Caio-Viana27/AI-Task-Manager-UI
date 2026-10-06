import { ApiError } from '../api/client.ts'
import errors from './locales/en/errors.json'

export type ErrorKey = keyof typeof errors

/**
 * The `errors` namespace key for an error: its API `code` when we have a message for it,
 * otherwise `generic` (network failures, non-ProblemDetail responses, unknown codes).
 */
export function errorKey(error: unknown): ErrorKey {
  if (error instanceof ApiError && error.code !== null && Object.hasOwn(errors, error.code)) {
    return error.code as ErrorKey
  }
  return 'generic'
}
