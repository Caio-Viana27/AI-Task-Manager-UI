import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SuggestResponse } from '../../../api/ai.ts'
import type { TaskDetail } from '../../../api/tasks.ts'
import { jsonResponse, problemResponse, stubFetch, TEST_USER_RESPONSE } from '../../../test/fetchMock.ts'
import { createTestQueryClient, renderRoute } from '../../../test/renderRoute.tsx'
import { taskDetail } from '../../tasks/detail/testFixtures.ts'
import { AiSuggestSlot, type AiSuggestFields } from '../AiSuggestSlot.tsx'

type Request = { method: string; path: string; body: unknown; headers: Headers }

const SUGGESTION: SuggestResponse = {
  suggestedTitle: 'Write the Q3 sales report',
  suggestedDescription: 'Collect the Q3 numbers and write the report.',
  suggestedPriority: 'HIGH',
  suggestedComplexity: 'HARD',
  reasoning: 'It has a deadline.',
}

/**
 * Stubs the session, `POST /ai/suggest` with `suggest`, and `GET`/`PATCH /tasks/{id}` over `task`.
 * Returns every request seen.
 */
function stubApi(suggest: () => Response, task?: TaskDetail) {
  const requests: Request[] = []
  let current = task
  stubFetch((request) => {
    requests.push(request)
    const { method, path, body } = request
    if (path === '/v1/users/me') {
      return jsonResponse(TEST_USER_RESPONSE)
    }
    if (method === 'POST' && path === '/v1/ai/suggest') {
      return suggest()
    }
    if (current && path === `/v1/tasks/${current.id}`) {
      if (method === 'PATCH') {
        current = { ...current, ...(body as Partial<TaskDetail>) }
      }
      return jsonResponse(current)
    }
    return problemResponse(500, 'INTERNAL_ERROR')
  })
  return {
    suggestCalls: () => requests.filter(({ path }) => path === '/v1/ai/suggest'),
    patches: () => requests.filter(({ method }) => method === 'PATCH').map(({ body }) => body),
  }
}

function renderSlot(values: AiSuggestFields, onApply = vi.fn()) {
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <AiSuggestSlot values={values} onApply={onApply} disabled={false} />
    </QueryClientProvider>,
  )
  return onApply
}

const FILLED: AiSuggestFields = { title: ' report ', description: 'numbers for q3', priority: 'MEDIUM', complexity: '' }

describe('AiSuggestSlot', () => {
  it('is disabled until the title and description are filled in', async () => {
    const user = userEvent.setup()
    stubApi(() => jsonResponse(SUGGESTION))
    renderRoute('/tasks/new', { token: 'stored-token' })

    const form = within(await screen.findByRole('form', { name: 'New task' }))
    const button = form.getByRole('button', { name: 'Suggest with AI' })
    expect(button).toHaveProperty('disabled', true)
    await user.type(form.getByLabelText('Title'), 'report')
    expect(button).toHaveProperty('disabled', true)
    await user.type(form.getByLabelText('Description'), '   ')
    expect(button).toHaveProperty('disabled', true)
    await user.type(form.getByLabelText('Description'), 'numbers')
    expect(button).toHaveProperty('disabled', false)
  })

  it('sends the trimmed values and shows current vs suggested values with the reasoning', async () => {
    const user = userEvent.setup()
    const { suggestCalls } = stubApi(() => jsonResponse(SUGGESTION))
    renderSlot(FILLED)

    await user.click(screen.getByRole('button', { name: 'Suggest with AI' }))

    const review = within(await screen.findByRole('group', { name: 'AI suggestion' }))
    expect(review.getByText('Write the Q3 sales report')).toBeDefined()
    expect(review.getByText('Not estimated')).toBeDefined()
    expect(review.getByText('Hard')).toBeDefined()
    expect(review.getByText('It has a deadline.')).toBeDefined()
    expect(suggestCalls().map(({ body }) => body)).toEqual([{ title: 'report', description: 'numbers for q3' }])
  })

  it('"Accept selected" applies only the checked fields and closes the review', async () => {
    const user = userEvent.setup()
    stubApi(() => jsonResponse(SUGGESTION))
    const onApply = renderSlot(FILLED)

    await user.click(screen.getByRole('button', { name: 'Suggest with AI' }))
    const review = within(await screen.findByRole('group', { name: 'AI suggestion' }))
    await user.click(review.getByLabelText('Use the suggested description'))
    await user.click(review.getByLabelText('Use the suggested complexity'))
    await user.click(review.getByRole('button', { name: 'Accept selected' }))

    expect(onApply).toHaveBeenCalledExactlyOnceWith({ title: 'Write the Q3 sales report', priority: 'HIGH' })
    expect(screen.queryByRole('group', { name: 'AI suggestion' })).toBeNull()
  })

  it('"Dismiss" closes the review without applying anything', async () => {
    const user = userEvent.setup()
    stubApi(() => jsonResponse(SUGGESTION))
    const onApply = renderSlot(FILLED)

    await user.click(screen.getByRole('button', { name: 'Suggest with AI' }))
    await user.click(await screen.findByRole('button', { name: 'Dismiss' }))

    expect(onApply).not.toHaveBeenCalled()
    expect(screen.queryByRole('group', { name: 'AI suggestion' })).toBeNull()
  })

  it('in the edit form, accepting and saving sends PATCH with only the changed fields', async () => {
    const user = userEvent.setup()
    const task = taskDetail('t1', { title: 'report', description: 'Description', priority: 'HIGH' })
    const { patches } = stubApi(
      () => jsonResponse({ ...SUGGESTION, suggestedDescription: 'Description', suggestedPriority: 'HIGH' }),
      task,
    )
    renderRoute('/tasks/t1', { token: 'stored-token' })

    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    const form = within(screen.getByRole('form', { name: 'Edit task' }))
    await user.click(form.getByRole('button', { name: 'Suggest with AI' }))
    await user.click(await form.findByRole('button', { name: 'Accept all' }))
    // Accepting only fills the form (D7): nothing is saved yet.
    expect(patches()).toEqual([])
    expect(form.getByLabelText('Title')).toHaveProperty('value', 'Write the Q3 sales report')
    await user.click(form.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Write the Q3 sales report' })).toBeDefined()
    expect(patches()).toEqual([{ title: 'Write the Q3 sales report', complexity: 'HARD' }])
  })

  it('shows the unavailable message on a 503 and leaves the form intact', async () => {
    const user = userEvent.setup()
    stubApi(() => problemResponse(503, 'AI_UNAVAILABLE'))
    renderRoute('/tasks/new', { token: 'stored-token' })

    const form = within(await screen.findByRole('form', { name: 'New task' }))
    await user.type(form.getByLabelText('Title'), 'report')
    await user.type(form.getByLabelText('Description'), 'numbers for q3')
    await user.click(form.getByRole('button', { name: 'Suggest with AI' }))

    expect(await form.findByText('The AI assistant is unavailable right now. Try again in a moment.')).toBeDefined()
    expect(form.getByLabelText('Title')).toHaveProperty('value', 'report')
    expect(form.getByLabelText('Description')).toHaveProperty('value', 'numbers for q3')
    expect(form.getByRole('button', { name: 'Suggest with AI' })).toHaveProperty('disabled', false)
  })

  it('a second click while a suggestion is loading sends nothing', async () => {
    const user = userEvent.setup()
    let release: (response: Response) => void = () => {}
    const { suggestCalls } = stubApi(() => new Promise<Response>((resolve) => (release = resolve)) as unknown as Response)
    renderSlot(FILLED)

    const button = screen.getByRole('button', { name: 'Suggest with AI' })
    await user.click(button)
    const loading = await screen.findByRole('button', { name: 'Asking the AI…' })
    expect(loading).toHaveProperty('disabled', true)
    await user.click(loading)
    release(jsonResponse(SUGGESTION))

    expect(await screen.findByRole('group', { name: 'AI suggestion' })).toBeDefined()
    expect(suggestCalls()).toHaveLength(1)
  })
})
