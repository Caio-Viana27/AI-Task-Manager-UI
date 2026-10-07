import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getToken } from '../auth/tokenStorage.ts'
import i18n from '../i18n/index.ts'
import { dashboardResponse, jsonResponse, problemResponse, stubFetch } from '../test/fetchMock.ts'
import { renderRoute } from '../test/renderRoute.tsx'

const AUTH_RESPONSE = {
  token: 'new-token',
  expiresAt: '2026-10-07T12:00:00Z',
  user: { id: 'a1b2', name: 'Ana Souza', email: 'ana@example.com' },
}

async function fillAndSubmit(email: string, password: string, submit = 'Log in') {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText(/^(Email|E-mail)$/), email)
  await user.type(screen.getByLabelText(/^(Password|Senha)$/), password)
  await user.click(screen.getByRole('button', { name: submit }))
}

describe('LoginPage', () => {
  it('logs in, stores the token and navigates to /', async () => {
    const fetchMock = stubFetch(({ path }) => dashboardResponse(path) ?? jsonResponse(AUTH_RESPONSE))
    const { router } = renderRoute('/login')

    await fillAndSubmit('  ana@example.com ', 'secret123')

    expect(await screen.findByRole('heading', { level: 1, name: 'Your tasks' })).toBeDefined()
    expect(router.state.location.pathname).toBe('/')
    expect(getToken()).toBe('new-token')
    expect(screen.getByText('Ana Souza')).toBeDefined()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/auth/signin')
    // The email is trimmed before sending (D4); the password is sent as typed.
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'ana@example.com', password: 'secret123' })
    // Sign-in is called once; the rest are the dashboard's own requests.
    expect(fetchMock.mock.calls.filter(([input]) => String(input) === '/api/v1/auth/signin')).toHaveLength(1)
  })

  it('returns to the originally requested page after a redirect', async () => {
    stubFetch(() => jsonResponse(AUTH_RESPONSE))
    const { router } = renderRoute('/tasks/42')
    expect(await screen.findByRole('heading', { level: 1, name: 'Log in' })).toBeDefined()

    await fillAndSubmit('ana@example.com', 'secret123')

    expect(await screen.findByRole('heading', { level: 1, name: 'Task 42' })).toBeDefined()
    expect(router.state.location.pathname).toBe('/tasks/42')
  })

  it.each([
    ['en', 'Log in', 'Wrong email or password.'],
    ['pt-BR', 'Entrar', 'E-mail ou senha incorretos.'],
  ])('shows the localized BAD_CREDENTIALS message in %s', async (lng, submit, message) => {
    await i18n.changeLanguage(lng)
    stubFetch(() => problemResponse(401, 'BAD_CREDENTIALS'))
    const { router } = renderRoute('/login')

    await fillAndSubmit('ana@example.com', 'wrong-password', submit)

    expect((await screen.findByRole('alert')).textContent).toBe(message)
    expect(router.state.location.pathname).toBe('/login')
    expect(getToken()).toBeNull()
  })

  it('disables the button while the request is pending', async () => {
    stubFetch(() => new Promise<Response>(() => undefined))
    renderRoute('/login')

    await fillAndSubmit('ana@example.com', 'secret123')

    const button = await screen.findByRole('button', { name: 'Logging in…' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it('requires both fields without calling the API', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(() => jsonResponse(AUTH_RESPONSE))
    renderRoute('/login')

    await user.click(await screen.findByRole('button', { name: 'Log in' }))

    expect(screen.getByText('Enter your email.')).toBeDefined()
    expect(screen.getByText('Enter your password.')).toBeDefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the expired-session banner with ?expired=1', async () => {
    renderRoute('/login?expired=1')

    expect((await screen.findByRole('status')).textContent).toBe('Your session has expired. Log in again.')
  })

  it('shows no banner without ?expired=1', async () => {
    renderRoute('/login')

    await screen.findByRole('heading', { level: 1, name: 'Log in' })
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('links to the signup and forgot-password pages', async () => {
    renderRoute('/login')

    const main = await screen.findByRole('main')
    expect(main.querySelector('a[href="/signup"]')).not.toBeNull()
    expect(main.querySelector('a[href="/forgot-password"]')?.textContent).toBe('Forgot your password?')
  })
})

describe('session expiry end to end', () => {
  it('a rejected stored token lands on /login with the expired banner', async () => {
    stubFetch(() => problemResponse(401, 'UNAUTHORIZED'))
    const { router } = renderRoute('/tasks/42', { token: 'garbage' })

    expect(await screen.findByText('Your session has expired. Log in again.')).toBeDefined()
    await waitFor(() => expect(router.state.location.search).toBe('?expired=1'))
    expect(getToken()).toBeNull()
  })
})
