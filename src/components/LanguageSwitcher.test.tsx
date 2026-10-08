import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { dashboardResponse, jsonResponse, stubFetch, TEST_USER_RESPONSE } from '../test/fetchMock.ts'
import { renderRoute } from '../test/renderRoute.tsx'

describe('LanguageSwitcher', () => {
  it('switches the visible text between EN and PT-BR from its menu', async () => {
    const user = userEvent.setup()
    stubFetch(({ path }) => dashboardResponse(path) ?? jsonResponse(TEST_USER_RESPONSE))
    renderRoute('/', { token: 'stored-token' })
    expect(await screen.findByRole('heading', { level: 1, name: 'Your tasks' })).toBeDefined()

    const trigger = screen.getByRole('button', { name: 'Language: EN' })
    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('menuitemradio', { name: 'EN' }).getAttribute('aria-checked')).toBe('true')
    await user.click(screen.getByRole('menuitemradio', { name: 'PT-BR' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Suas tarefas' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Nova tarefa' })).toBeDefined()
    expect(screen.queryByRole('menu')).toBeNull()
    expect(document.documentElement.lang).toBe('pt-BR')
    expect(localStorage.getItem('planned.language')).toBe('pt-BR')

    await user.click(screen.getByRole('button', { name: 'Idioma: PT-BR' }))
    expect(screen.getByRole('menuitemradio', { name: 'PT-BR' }).getAttribute('aria-checked')).toBe('true')
    await user.click(screen.getByRole('menuitemradio', { name: 'EN' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Your tasks' })).toBeDefined()
    expect(document.documentElement.lang).toBe('en')
  })

  it('closes with Escape and returns focus to its button', async () => {
    const user = userEvent.setup()
    stubFetch(({ path }) => dashboardResponse(path) ?? jsonResponse(TEST_USER_RESPONSE))
    renderRoute('/', { token: 'stored-token' })

    const trigger = await screen.findByRole('button', { name: 'Language: EN' })
    await user.click(trigger)
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'EN' }))
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'PT-BR' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
})
