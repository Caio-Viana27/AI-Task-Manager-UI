import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../test/renderRoute.tsx'

describe('routes', () => {
  it.each([
    ['/login', 'Log in'],
    ['/signup', 'Sign up'],
    ['/forgot-password', 'Forgot password'],
    ['/reset-password?token=abc', 'Reset password'],
    ['/', 'Your tasks'],
    ['/tasks/new', 'New task'],
    ['/tasks/42', 'Task 42'],
    ['/no-such-page', 'Page not found'],
  ])('%s renders its page', async (path, heading) => {
    renderRoute(path)

    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeDefined()
  })
})
