import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { dashboardResponse, jsonResponse, stubFetch, TEST_USER_RESPONSE } from '../test/fetchMock.ts'
import { renderRoute } from '../test/renderRoute.tsx'

describe('routes', () => {
  it.each([
    ['/login', 'Log in'],
    ['/signup', 'Sign up'],
    ['/forgot-password', 'Forgot password'],
    ['/reset-password?token=abc', 'Reset password'],
    ['/no-such-page', 'Page not found'],
  ])('%s renders its page without a session', async (path, heading) => {
    renderRoute(path)

    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeDefined()
  })

  it.each([
    ['/', 'Your tasks'],
    ['/tasks/new', 'New task'],
    ['/tasks/42', 'Task 42'],
  ])('%s renders its page with a session', async (path, heading) => {
    stubFetch(({ path }) => dashboardResponse(path) ?? jsonResponse(TEST_USER_RESPONSE))
    renderRoute(path, { token: 'stored-token' })

    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeDefined()
  })
})
