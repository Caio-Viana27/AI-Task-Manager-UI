import { vi } from 'vitest'

export function jsonResponse(body: unknown, status = 200): Response {
  const contentType = status >= 400 ? 'application/problem+json' : 'application/json'
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

/** A ProblemDetail response with the given status and error code (PLAN §2). */
export function problemResponse(status: number, code: string, errors?: { field: string; message: string }[]): Response {
  return jsonResponse({ type: 'about:blank', status, title: 'Error', detail: code, code, ...(errors && { errors }) }, status)
}

type Handler = (request: { method: string; path: string; body: unknown; headers: Headers }) => Response | Promise<Response>

/**
 * Replaces `fetch` with `handler`, which gets the method, the path without `/api`, the parsed
 * JSON body and the headers. `setup.ts` restores the real `fetch` after each test.
 */
export function stubFetch(handler: Handler) {
  const fetchMock = vi.fn<typeof fetch>(async (input, init = {}) => {
    const url = String(input)
    const path = url.startsWith('/api') ? url.slice('/api'.length) : url
    const body = typeof init.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined
    return handler({ method: init.method ?? 'GET', path, body, headers: new Headers(init.headers) })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** The `/users/me` body for a test user. */
export const TEST_USER_RESPONSE = {
  id: '6f1c2e4a-9d0b-4c8e-8a51-2b7f3d9e1a10',
  name: 'Ana Souza',
  email: 'ana@example.com',
  roles: ['USER'],
}

/** An empty `GET /tasks` page. */
export const EMPTY_TASK_PAGE = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }

/** The `GET /lookups` body: the seeded names in seed order (D3). */
export const TEST_LOOKUPS = {
  priorities: ['LOW', 'MEDIUM', 'HIGH'],
  statuses: ['TODO', 'IN_PROGRESS', 'OVERDUE', 'DONE'],
  complexities: ['EASY', 'MEDIUM', 'HARD'],
}

/**
 * Answers the dashboard's own requests (`GET /tasks` with an empty page, `GET /lookups`), or
 * returns `undefined` for any other path. For tests that land on `/` but test something else:
 * `stubFetch(({ path }) => dashboardResponse(path) ?? jsonResponse(TEST_USER_RESPONSE))`.
 */
export function dashboardResponse(path: string): Response | undefined {
  if (path === '/v1/lookups') {
    return jsonResponse(TEST_LOOKUPS)
  }
  if (path === '/v1/tasks' || path.startsWith('/v1/tasks?')) {
    return jsonResponse(EMPTY_TASK_PAGE)
  }
  return undefined
}
