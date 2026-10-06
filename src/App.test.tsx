import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('renders the dashboard at the root URL', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { level: 1, name: 'Your tasks' })).toBeDefined()
  })
})
