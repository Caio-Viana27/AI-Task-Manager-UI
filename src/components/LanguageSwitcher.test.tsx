import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../test/renderRoute.tsx'

describe('LanguageSwitcher', () => {
  it('switches the visible text between EN and PT-BR', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Your tasks' })).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'PT-BR' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Suas tarefas' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Nova tarefa' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'PT-BR' }).getAttribute('aria-pressed')).toBe('true')
    expect(document.documentElement.lang).toBe('pt-BR')
    expect(localStorage.getItem('planned.language')).toBe('pt-BR')

    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Your tasks' })).toBeDefined()
    expect(document.documentElement.lang).toBe('en')
  })
})
