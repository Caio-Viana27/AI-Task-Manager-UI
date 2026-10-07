import { describe, expect, it } from 'vitest'
import { setToken } from '../auth/tokenStorage.ts'
import { jsonResponse, stubFetch, TEST_USER_RESPONSE } from '../test/fetchMock.ts'
import { getMe, signIn, signUp } from './auth.ts'

const AUTH_RESPONSE = {
  token: 'jwt',
  expiresAt: '2026-10-07T12:00:00Z',
  user: { id: TEST_USER_RESPONSE.id, name: 'Ana Souza', email: 'ana@example.com' },
}

describe('auth api', () => {
  it('signs up with POST /v1/auth/signup', async () => {
    const fetchMock = stubFetch(() => jsonResponse(AUTH_RESPONSE, 201))

    const request = { email: 'ana@example.com', name: 'Ana', password: 'secret123' }
    await expect(signUp(request)).resolves.toEqual(AUTH_RESPONSE)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/auth/signup')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual(request)
  })

  it('signs in with POST /v1/auth/signin', async () => {
    const fetchMock = stubFetch(() => jsonResponse(AUTH_RESPONSE))

    await expect(signIn({ email: 'ana@example.com', password: 'secret123' })).resolves.toEqual(AUTH_RESPONSE)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/auth/signin')
    expect(init?.method).toBe('POST')
  })

  it('maps GET /v1/users/me to an AuthUser without roles', async () => {
    setToken('jwt')
    const fetchMock = stubFetch(() => jsonResponse(TEST_USER_RESPONSE))

    await expect(getMe()).resolves.toEqual({
      id: TEST_USER_RESPONSE.id,
      name: TEST_USER_RESPONSE.name,
      email: TEST_USER_RESPONSE.email,
    })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/users/me')
  })
})
