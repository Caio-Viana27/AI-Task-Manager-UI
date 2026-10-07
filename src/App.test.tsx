import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { createTestQueryClient } from './test/renderRoute.tsx'

describe('App', () => {
  it('renders the dashboard at the root URL', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <App />
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Your tasks' })).toBeDefined()
  })
})
