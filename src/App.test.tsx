import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { createTestQueryClient } from './test/renderRoute.tsx'

describe('App', () => {
  it('sends a visitor without a session from the root URL to login', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <App />
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Log in' })).toBeDefined()
  })
})
