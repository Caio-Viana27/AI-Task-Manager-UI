import { getToken } from '../auth/tokenStorage.ts'
import i18n from '../i18n/index.ts'

/** One entry of the `errors` list in a validation ProblemDetail (PLAN §2, Errors). */
export interface FieldError {
  field: string
  message: string
}

/**
 * A failed API call. `code` is the ProblemDetail `code` (PLAN §2), or `null` when the
 * response wasn't a ProblemDetail, e.g. a proxy error page.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string | null
  readonly errors: FieldError[]

  constructor(status: number, code: string | null, errors: FieldError[], message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.errors = errors
  }
}

const baseUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '')

let unauthorizedHandler: (() => void) | null = null

/**
 * Registers the handler for a 401 on an authenticated request (expired or invalid token).
 * A 401 on a request sent without a token, such as a failed sign-in, doesn't trigger it.
 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Serialized as JSON. */
  body?: unknown
  signal?: AbortSignal
}

/** Calls the API and returns the parsed JSON body, or `undefined` for an empty response. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options

  // The UI's language, not the browser's: AI text comes back in it (wave 3, D5).
  const headers = new Headers({ Accept: 'application/json', 'Accept-Language': i18n.resolvedLanguage ?? i18n.language ?? 'en' })
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    if (response.status === 401 && token) {
      unauthorizedHandler?.()
    }
    throw await toApiError(response)
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

async function toApiError(response: Response): Promise<ApiError> {
  const problem = await readJson(response)
  const code = typeof problem?.code === 'string' ? problem.code : null
  const errors = Array.isArray(problem?.errors) ? problem.errors.filter(isFieldError) : []
  const message =
    typeof problem?.detail === 'string' ? problem.detail : `Request failed with status ${response.status}`
  return new ApiError(response.status, code, errors, message)
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const json: unknown = await response.json()
    return typeof json === 'object' && json !== null ? (json as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function isFieldError(value: unknown): value is FieldError {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const { field, message } = value as Record<string, unknown>
  return typeof field === 'string' && typeof message === 'string'
}
