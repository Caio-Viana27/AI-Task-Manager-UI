import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getToken } from '../auth/tokenStorage.ts'
import { dashboardResponse, EMPTY_TASK_PAGE, jsonResponse, problemResponse, stubFetch, TEST_USER_RESPONSE } from '../test/fetchMock.ts'
import { renderRoute } from '../test/renderRoute.tsx'
import { redirectTarget } from './redirectTarget.ts'

describe('ProtectedRoute', () => {
  it.each(['/', '/tasks/new', '/tasks/42'])('%s redirects to /login without a token', async (path) => {
    const { router } = renderRoute(path)

    expect(await screen.findByRole('heading', { level: 1, name: 'Log in' })).toBeDefined()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state).toMatchObject({ from: { pathname: path } })
  })

  it('shows a loading state while the session is restored', async () => {
    stubFetch(() => new Promise<Response>(() => undefined))

    renderRoute('/', { token: 'stored-token' })

    expect(await screen.findByRole('status')).toBeDefined()
    expect(screen.getByText('Loading your session…')).toBeDefined()
  })

  it('shows the generic error with "Try again" when /users/me fails, and recovers', async () => {
    const user = userEvent.setup()
    let fail = true
    stubFetch(({ path }) =>
      fail ? problemResponse(503, 'INTERNAL_ERROR') : (dashboardResponse(path) ?? jsonResponse(TEST_USER_RESPONSE)),
    )
    renderRoute('/', { token: 'stored-token' })

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Something went wrong. Check your connection and try again.',
    )
    expect(getToken()).toBe('stored-token')

    fail = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Your tasks' })).toBeDefined()
  })
})

describe('GuestRoute', () => {
  it.each(['/login', '/signup'])('%s redirects to / with a valid session', async (path) => {
    stubFetch(({ path }) => dashboardResponse(path) ?? jsonResponse(TEST_USER_RESPONSE))

    const { router } = renderRoute(path, { token: 'stored-token' })

    expect(await screen.findByRole('heading', { level: 1, name: 'Your tasks' })).toBeDefined()
    expect(router.state.location.pathname).toBe('/')
  })
})

describe('redirectTarget', () => {
  it('returns the saved location with its search and hash', () => {
    expect(redirectTarget({ from: { pathname: '/tasks/42', search: '?tab=sub', hash: '#top' } })).toBe(
      '/tasks/42?tab=sub#top',
    )
  })

  it.each([null, undefined, {}, { from: { pathname: '/login' } }, 'junk'])('falls back to / for %j', (state) => {
    expect(redirectTarget(state)).toBe('/')
  })
})

describe('PublicLayout header', () => {
  it('shows "Log in" and "Sign up" when logged out', async () => {
    renderRoute('/forgot-password')

    const nav = within(await screen.findByRole('navigation'))
    expect(nav.getByRole('link', { name: 'Sign up' })).toBeDefined()
    expect(nav.getByRole('link', { name: 'Log in' })).toBeDefined()
    expect(nav.queryByRole('link', { name: 'All tasks' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull()
  })
})

describe('AppShell sidebar', () => {
  it('shows the user, the task views and "Log out" when logged in; logging out ends on /login', async () => {
    const user = userEvent.setup()
    stubFetch(({ path }) => dashboardResponse(path) ?? jsonResponse(TEST_USER_RESPONSE))
    const { router } = renderRoute('/', { token: 'stored-token' })

    expect(await screen.findByText('Ana Souza')).toBeDefined()
    const nav = within(screen.getByRole('navigation'))
    expect(nav.getByRole('link', { name: 'All tasks' }).getAttribute('aria-current')).toBe('page')
    expect(nav.getByRole('link', { name: 'Completed' }).getAttribute('href')).toBe('/?status=DONE')
    expect(nav.getByRole('link', { name: 'Today' })).toBeDefined()
    expect(nav.getByRole('link', { name: 'Upcoming' })).toBeDefined()
    expect(nav.queryByRole('link', { name: 'Log in' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Log in' })).toBeDefined()
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(getToken()).toBeNull()
    expect(screen.queryByText('Ana Souza')).toBeNull()
  })

  it('marks the view that matches the URL, and shows the counts', async () => {
    const user = userEvent.setup()
    stubFetch(({ path }) => {
      const [pathname, query = ''] = path.split('?')
      const params = new URLSearchParams(query)
      if (pathname === '/v1/tasks' && params.get('size') === '1') {
        const total = params.getAll('status').join() === 'DONE' ? 4 : 9
        return jsonResponse({ ...EMPTY_TASK_PAGE, totalElements: total })
      }
      return dashboardResponse(path) ?? jsonResponse(TEST_USER_RESPONSE)
    })
    const { router } = renderRoute('/', { token: 'stored-token' })
    const nav = within(await screen.findByRole('navigation'))

    await waitFor(() => expect(nav.getByRole('link', { name: 'Completed' }).textContent).toBe('Completed4'))
    expect(nav.getByRole('link', { name: 'All tasks' }).textContent).toBe('All tasks9')

    await user.click(nav.getByRole('link', { name: 'Completed' }))

    expect(router.state.location.search).toBe('?status=DONE')
    expect(nav.getByRole('link', { name: 'Completed' }).getAttribute('aria-current')).toBe('page')
    expect(nav.getByRole('link', { name: 'All tasks' }).getAttribute('aria-current')).toBeNull()
  })

  it('opens as a drawer from the menu button and closes with Escape or its close button', async () => {
    const user = userEvent.setup()
    stubFetch(({ path }) => dashboardResponse(path) ?? jsonResponse(TEST_USER_RESPONSE))
    renderRoute('/', { token: 'stored-token' })
    const sidebar = (await screen.findByRole('navigation')).closest('aside') as HTMLElement
    expect(sidebar.className).toContain('-translate-x-full')

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(sidebar.className).not.toContain('-translate-x-full')
    await user.keyboard('{Escape}')
    expect(sidebar.className).toContain('-translate-x-full')

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(sidebar.className).toContain('-translate-x-full')
  })

  it('collapses to icons on wide screens and remembers it', async () => {
    const user = userEvent.setup()
    stubFetch(({ path }) => dashboardResponse(path) ?? jsonResponse(TEST_USER_RESPONSE))
    renderRoute('/', { token: 'stored-token' })

    await user.click(await screen.findByRole('button', { name: 'Collapse sidebar' }))

    expect(localStorage.getItem('planned.sidebarCollapsed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeDefined()
    // The labels stay for screen readers.
    expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'All tasks' })).toBeDefined()
  })
})
