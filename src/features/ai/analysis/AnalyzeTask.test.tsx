import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { TaskAnalysis } from '../../../api/aiAnalysis.ts'
import type { TaskDetail } from '../../../api/tasks.ts'
import i18n from '../../../i18n/index.ts'
import { jsonResponse, problemResponse, stubFetch, TEST_USER_RESPONSE } from '../../../test/fetchMock.ts'
import { renderRoute } from '../../../test/renderRoute.tsx'
import { taskDetail } from '../../tasks/detail/testFixtures.ts'

type Request = { method: string; path: string; body: unknown; headers: Headers }

const ANALYSIS: TaskAnalysis = {
  priority: 'HIGH',
  complexity: 'MEDIUM',
  estimatedHours: 8,
  reason: 'It touches authentication and the database.',
}

const TASK = taskDetail('t1', {
  title: 'Add login',
  description: 'JWT login',
  priority: 'LOW',
  complexity: 'EASY',
  estimatedHours: 3,
})

/**
 * Stubs the session, `POST /tasks/t1/ai/analysis` with `analysis`, and `GET`/`PATCH /tasks/t1`
 * over `task`. Returns every request seen.
 */
function stubApi(analysis: () => Response | Promise<Response>, task: TaskDetail = TASK) {
  const requests: Request[] = []
  let current = task
  stubFetch((request) => {
    requests.push(request)
    const { method, path, body } = request
    if (path === '/v1/users/me') {
      return jsonResponse(TEST_USER_RESPONSE)
    }
    if (method === 'POST' && path === `/v1/tasks/${task.id}/ai/analysis`) {
      return analysis()
    }
    if (path === `/v1/tasks/${task.id}`) {
      if (method === 'PATCH') {
        current = { ...current, ...(body as Partial<TaskDetail>) }
      }
      return jsonResponse(current)
    }
    return problemResponse(500, 'INTERNAL_ERROR')
  })
  return {
    analysisCalls: () => requests.filter(({ path }) => path.endsWith('/ai/analysis')),
    writes: () => requests.filter(({ method, path }) => method !== 'GET' && !path.endsWith('/ai/analysis')),
  }
}

async function renderTask() {
  renderRoute('/tasks/t1', { token: 'stored-token' })
  await screen.findByRole('heading', { level: 1, name: 'Add login' })
}

function review() {
  return screen.queryByRole('region', { name: 'AI analysis' })
}

describe('Analyze with AI', () => {
  it('sits between Edit and Delete and is hidden while editing', async () => {
    const user = userEvent.setup()
    stubApi(() => jsonResponse(ANALYSIS))
    await renderTask()

    const edit = screen.getByRole('button', { name: 'Edit' })
    const analyze = screen.getByRole('button', { name: 'Analyze with AI' })
    const remove = screen.getByRole('button', { name: 'Delete' })
    // Siblings, in this order.
    expect([...(edit.parentElement?.children ?? [])]).toEqual([edit, analyze, remove])

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('form', { name: 'Edit task' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Analyze with AI' })).toBeNull()
  })

  it('is disabled while the analysis is loading', async () => {
    const user = userEvent.setup()
    let respond: (response: Response) => void = () => undefined
    stubApi(() => new Promise<Response>((resolve) => (respond = resolve)))
    await renderTask()

    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }))
    const pending = await screen.findByRole('button', { name: 'Analyzing…' })
    expect(pending).toHaveProperty('disabled', true)

    respond(jsonResponse(ANALYSIS))
    expect(await screen.findByRole('region', { name: 'AI analysis' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Analyze with AI' })).toHaveProperty('disabled', false)
  })

  it('shows current vs suggested values and the reason, without saving anything', async () => {
    const user = userEvent.setup()
    const { analysisCalls, writes } = stubApi(() => jsonResponse(ANALYSIS))
    await renderTask()

    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }))
    const result = within(await screen.findByRole('region', { name: 'AI analysis' }))

    const items = result.getAllByRole('listitem')
    const pairs = items.map((item) => within(item).getAllByRole('definition').map((dd) => dd.textContent))
    expect(pairs).toEqual([
      ['Low', 'High'],
      ['Easy', 'Medium'],
      ['3 hours', '8 hours'],
    ])
    expect(result.getByText('It touches authentication and the database.')).toBeDefined()
    for (const label of ['Use the suggested priority', 'Use the suggested complexity', 'Use the suggested estimate']) {
      expect(result.getByLabelText(label)).toHaveProperty('checked', true)
    }
    const calls = analysisCalls()
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('POST')
    expect(calls[0].body).toBeUndefined()
    expect(calls[0].headers.get('Accept-Language')).toBe('en')
    expect(writes()).toEqual([])
  })

  it('shows "Not estimated" for a task without hours', async () => {
    const user = userEvent.setup()
    stubApi(() => jsonResponse(ANALYSIS), { ...TASK, estimatedHours: null })
    await renderTask()

    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }))
    const result = within(await screen.findByRole('region', { name: 'AI analysis' }))
    const hours = within(result.getAllByRole('listitem')[2]).getAllByRole('definition')
    expect(hours.map((dd) => dd.textContent)).toEqual(['Not estimated', '8 hours'])
  })

  it('sends the UI language in PT-BR', async () => {
    await i18n.changeLanguage('pt-BR')
    const user = userEvent.setup()
    const { analysisCalls } = stubApi(() => jsonResponse(ANALYSIS))
    renderRoute('/tasks/t1', { token: 'stored-token' })

    await user.click(await screen.findByRole('button', { name: 'Analisar com IA' }))
    expect(await screen.findByRole('region', { name: 'Análise da IA' })).toBeDefined()
    expect(screen.getByText('8 horas')).toBeDefined()
    expect(analysisCalls()[0].headers.get('Accept-Language')).toBe('pt-BR')
  })

  it('applying with one field unchecked opens the form with only the checked fields changed, and Save patches exactly those', async () => {
    const user = userEvent.setup()
    const { writes } = stubApi(() => jsonResponse(ANALYSIS))
    await renderTask()

    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }))
    const result = within(await screen.findByRole('region', { name: 'AI analysis' }))
    await user.click(result.getByLabelText('Use the suggested complexity'))
    await user.click(result.getByRole('button', { name: 'Apply to form' }))

    // Applying only fills the form: nothing is saved yet.
    expect(review()).toBeNull()
    expect(writes()).toEqual([])
    const form = within(screen.getByRole('form', { name: 'Edit task' }))
    expect(form.getByLabelText('Title')).toHaveProperty('value', 'Add login')
    expect(form.getByLabelText('Priority')).toHaveProperty('value', 'HIGH')
    expect(form.getByLabelText('Complexity')).toHaveProperty('value', 'EASY')
    expect(form.getByLabelText('Estimated hours')).toHaveProperty('value', '8')

    await user.click(form.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(screen.queryByRole('form', { name: 'Edit task' })).toBeNull())
    expect(writes().map(({ method, path, body }) => ({ method, path, body }))).toEqual([
      { method: 'PATCH', path: '/v1/tasks/t1', body: { priority: 'HIGH', estimatedHours: 8 } },
    ])
    expect(await screen.findByText('8 hours')).toBeDefined()
  })

  it('cancelling the applied form saves nothing', async () => {
    const user = userEvent.setup()
    const { writes } = stubApi(() => jsonResponse(ANALYSIS))
    await renderTask()

    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }))
    await user.click(await screen.findByRole('button', { name: 'Apply to form' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('form', { name: 'Edit task' })).toBeNull()
    expect(review()).toBeNull()
    expect(writes()).toEqual([])
  })

  it('"Apply to form" is disabled when no field is checked', async () => {
    const user = userEvent.setup()
    stubApi(() => jsonResponse(ANALYSIS))
    await renderTask()

    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }))
    const result = within(await screen.findByRole('region', { name: 'AI analysis' }))
    for (const label of ['Use the suggested priority', 'Use the suggested complexity', 'Use the suggested estimate']) {
      await user.click(result.getByLabelText(label))
    }
    expect(result.getByRole('button', { name: 'Apply to form' })).toHaveProperty('disabled', true)
  })

  it('Dismiss hides the review and changes nothing', async () => {
    const user = userEvent.setup()
    const { writes } = stubApi(() => jsonResponse(ANALYSIS))
    await renderTask()

    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }))
    await user.click(await screen.findByRole('button', { name: 'Dismiss' }))

    expect(review()).toBeNull()
    expect(screen.queryByRole('form', { name: 'Edit task' })).toBeNull()
    expect(writes()).toEqual([])
  })

  it.each([
    [422, 'AI_INVALID_RESPONSE', "The AI returned a response we couldn't use. Try again."],
    [429, 'AI_RATE_LIMITED', "You've reached the hourly AI limit. Try again later."],
    [503, 'AI_UNAVAILABLE', 'The AI assistant is unavailable right now. Try again in a moment.'],
  ])('a %i %s shows the localized message and changes nothing', async (status, code, message) => {
    const user = userEvent.setup()
    const { analysisCalls, writes } = stubApi(() => problemResponse(status, code))
    await renderTask()

    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }))

    expect((await screen.findByRole('alert')).textContent).toBe(message)
    expect(review()).toBeNull()
    expect(screen.queryByRole('form', { name: 'Edit task' })).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Add login' })).toBeDefined()
    expect(screen.getByText('3 hours')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Analyze with AI' })).toHaveProperty('disabled', false)
    // Never retried on its own (wave 3, D9).
    expect(analysisCalls()).toHaveLength(1)
    expect(writes()).toEqual([])
  })

  it('shows the error in PT-BR', async () => {
    await i18n.changeLanguage('pt-BR')
    const user = userEvent.setup()
    stubApi(() => problemResponse(503, 'AI_UNAVAILABLE'))
    renderRoute('/tasks/t1', { token: 'stored-token' })

    await user.click(await screen.findByRole('button', { name: 'Analisar com IA' }))
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe(i18n.t('errors:AI_UNAVAILABLE', { lng: 'pt-BR' }))
  })
})
