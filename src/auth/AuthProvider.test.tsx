import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Outlet, useLocation, type RouteObject } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../api/client.ts'
import { jsonResponse, problemResponse, stubFetch, TEST_USER_RESPONSE } from '../test/fetchMock.ts'
import { renderRoute } from '../test/renderRoute.tsx'
import { AuthProvider } from './AuthProvider.tsx'
import { getToken, TOKEN_KEY } from './tokenStorage.ts'
import { useAuth } from './useAuth.ts'

const AUTH_RESPONSE = {
  token: 'new-token',
  expiresAt: '2026-10-07T12:00:00Z',
  user: { id: 'b2c3', name: 'Bruno Lima', email: 'bruno@example.com' },
}

function Probe() {
  const { status, user, login, logout, retry } = useAuth()
  const location = useLocation()

  function sendTwoRequests() {
    void apiRequest('/v1/tasks').catch(() => undefined)
    void apiRequest('/v1/tasks').catch(() => undefined)
  }

  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="user">{user?.name ?? ''}</p>
      <p data-testid="location">{location.pathname + location.search}</p>
      <button onClick={() => login(AUTH_RESPONSE)}>login</button>
      <button onClick={logout}>logout</button>
      <button onClick={retry}>retry</button>
      <button onClick={sendTwoRequests}>two requests</button>
    </div>
  )
}

const routes: RouteObject[] = [
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [{ path: '*', element: <Probe /> }],
  },
]

const statusText = () => screen.getByTestId('status').textContent
const locationText = () => screen.getByTestId('location').textContent

async function expectStatus(status: string) {
  await waitFor(() => expect(statusText()).toBe(status))
}

describe('AuthProvider', () => {
  it('starts anonymous without a token and sends no request', () => {
    const fetchMock = stubFetch(() => jsonResponse(TEST_USER_RESPONSE))

    renderRoute('/', { routes })

    expect(statusText()).toBe('anonymous')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('login stores the token and exposes the user without a request', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(() => jsonResponse(TEST_USER_RESPONSE))
    renderRoute('/', { routes })

    await user.click(screen.getByRole('button', { name: 'login' }))

    await expectStatus('authenticated')
    expect(screen.getByTestId('user').textContent).toBe('Bruno Lima')
    expect(getToken()).toBe('new-token')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('loads the user from /users/me when a token is stored', async () => {
    const fetchMock = stubFetch(() => jsonResponse(TEST_USER_RESPONSE))

    renderRoute('/', { routes, token: 'stored-token' })

    expect(statusText()).toBe('loading')
    await expectStatus('authenticated')
    expect(screen.getByTestId('user').textContent).toBe('Ana Souza')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/users/me')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer stored-token')
  })

  it('logout clears the token and the query cache, and lands on /login', async () => {
    const user = userEvent.setup()
    stubFetch(() => jsonResponse(TEST_USER_RESPONSE))
    const { queryClient } = renderRoute('/tasks/1', { routes, token: 'stored-token' })
    await expectStatus('authenticated')
    queryClient.setQueryData(['tasks'], [])

    await user.click(screen.getByRole('button', { name: 'logout' }))

    await expectStatus('anonymous')
    expect(locationText()).toBe('/login')
    expect(getToken()).toBeNull()
    // The provider's disabled ['me'] observer may recreate an empty query; no data survives.
    expect(queryClient.getQueryData(['tasks'])).toBeUndefined()
    expect(queryClient.getQueryData(['me'])).toBeUndefined()
  })

  it('a 401 on an authenticated request logs out once and lands on /login?expired=1', async () => {
    const user = userEvent.setup()
    stubFetch(({ path }) => (path === '/v1/users/me' ? jsonResponse(TEST_USER_RESPONSE) : problemResponse(401, 'UNAUTHORIZED')))
    const { queryClient } = renderRoute('/', { routes, token: 'expired-token' })
    await expectStatus('authenticated')
    const clearSpy = vi.spyOn(queryClient, 'clear')

    await user.click(screen.getByRole('button', { name: 'two requests' }))

    await waitFor(() => expect(locationText()).toBe('/login?expired=1'))
    expect(statusText()).toBe('anonymous')
    expect(getToken()).toBeNull()
    // Let the second 401 settle too: it must not redirect or clear again.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(clearSpy).toHaveBeenCalledOnce()
  })

  it('an old token rejected by /users/me counts as an expired session', async () => {
    stubFetch(() => problemResponse(401, 'UNAUTHORIZED'))

    renderRoute('/', { routes, token: 'old-token' })

    await waitFor(() => expect(locationText()).toBe('/login?expired=1'))
    expect(statusText()).toBe('anonymous')
    expect(getToken()).toBeNull()
  })

  it('a 500 from /users/me keeps the token, exposes error, and retry recovers', async () => {
    const user = userEvent.setup()
    let fail = true
    stubFetch(() => (fail ? problemResponse(500, 'INTERNAL_ERROR') : jsonResponse(TEST_USER_RESPONSE)))
    renderRoute('/', { routes, token: 'stored-token' })

    await expectStatus('error')
    expect(getToken()).toBe('stored-token')
    expect(locationText()).toBe('/')

    fail = false
    await user.click(screen.getByRole('button', { name: 'retry' }))

    await expectStatus('authenticated')
    expect(screen.getByTestId('user').textContent).toBe('Ana Souza')
  })

  it('a network error from /users/me keeps the token and exposes error', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')))

    renderRoute('/', { routes, token: 'stored-token' })

    await expectStatus('error')
    expect(getToken()).toBe('stored-token')
  })

  it('logs out when another tab removes the token', async () => {
    stubFetch(() => jsonResponse(TEST_USER_RESPONSE))
    renderRoute('/tasks/1', { routes, token: 'stored-token' })
    await expectStatus('authenticated')

    localStorage.removeItem(TOKEN_KEY)
    window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_KEY, oldValue: 'stored-token', newValue: null }))

    await expectStatus('anonymous')
    expect(locationText()).toBe('/login')
  })

  it('picks up a login made in another tab and loads that user', async () => {
    stubFetch(() => jsonResponse(TEST_USER_RESPONSE))
    renderRoute('/login', { routes })
    expect(statusText()).toBe('anonymous')

    localStorage.setItem(TOKEN_KEY, 'other-tab-token')
    window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_KEY, oldValue: null, newValue: 'other-tab-token' }))

    await expectStatus('authenticated')
    expect(screen.getByTestId('user').textContent).toBe('Ana Souza')
  })

  it('ignores storage events for other keys', async () => {
    stubFetch(() => jsonResponse(TEST_USER_RESPONSE))
    renderRoute('/', { routes, token: 'stored-token' })
    await expectStatus('authenticated')

    window.dispatchEvent(new StorageEvent('storage', { key: 'planned.language', newValue: 'pt-BR' }))

    expect(statusText()).toBe('authenticated')
    expect(locationText()).toBe('/')
  })
})
