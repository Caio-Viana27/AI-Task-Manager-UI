import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearToken, setToken } from '../auth/tokenStorage.ts'
import { ApiError, apiRequest, setUnauthorizedHandler } from './client.ts'

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown, status = 200, contentType = 'application/json'): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

function sentRequest(): { url: string; init: RequestInit; headers: Headers } {
  const [url, init = {}] = fetchMock.mock.calls[0]
  return { url: String(url), init, headers: new Headers(init.headers) }
}

describe('apiRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    setUnauthorizedHandler(null)
    clearToken()
  })

  it('prefixes the path with /api and returns the JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }))

    await expect(apiRequest('/tasks/1')).resolves.toEqual({ id: 1 })
    expect(sentRequest().url).toBe('/api/tasks/1')
  })

  it('sends a JSON body with its content type', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }, 201))

    await apiRequest('/tasks', { method: 'POST', body: { title: 'Write tests' } })

    const { init, headers } = sentRequest()
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"title":"Write tests"}')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('returns undefined for an empty response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(apiRequest('/tasks/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('adds the Authorization header when a token exists', async () => {
    setToken('my-token')
    fetchMock.mockResolvedValue(jsonResponse([]))

    await apiRequest('/tasks')

    expect(sentRequest().headers.get('Authorization')).toBe('Bearer my-token')
  })

  it('omits the Authorization header without a token', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]))

    await apiRequest('/tasks')

    expect(sentRequest().headers.has('Authorization')).toBe(false)
  })

  it('parses a ProblemDetail into an ApiError', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: 'Invalid request content.',
          code: 'VALIDATION_ERROR',
          errors: [{ field: 'title', message: 'must not be blank' }],
        },
        400,
        'application/problem+json',
      ),
    )

    const error = await apiRequest('/tasks', { method: 'POST', body: {} }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      errors: [{ field: 'title', message: 'must not be blank' }],
      message: 'Invalid request content.',
    })
  })

  it('returns an ApiError without a code when the body is not a ProblemDetail', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }))

    const error = await apiRequest('/tasks').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 502, code: null, errors: [] })
  })

  it('calls the unauthorized handler on a 401 for an authenticated request', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    setToken('expired-token')
    fetchMock.mockResolvedValue(jsonResponse({ status: 401, code: 'UNAUTHORIZED' }, 401))

    const error = await apiRequest('/tasks').catch((e: unknown) => e)

    expect(onUnauthorized).toHaveBeenCalledOnce()
    expect(error).toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
  })

  it('does not call the unauthorized handler on a 401 without a token', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    fetchMock.mockResolvedValue(jsonResponse({ status: 401, code: 'BAD_CREDENTIALS' }, 401))

    const error = await apiRequest('/auth/login', { method: 'POST', body: {} }).catch((e: unknown) => e)

    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(error).toMatchObject({ status: 401, code: 'BAD_CREDENTIALS' })
  })

  it('still sends the request when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    fetchMock.mockResolvedValue(jsonResponse([]))

    await expect(apiRequest('/tasks')).resolves.toEqual([])
    expect(sentRequest().headers.has('Authorization')).toBe(false)
  })
})
