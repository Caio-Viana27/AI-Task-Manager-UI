import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { ChatRequest } from '../../api/chat.ts'
import i18n from '../../i18n/index.ts'
import { dashboardResponse, jsonResponse, problemResponse, stubFetch, TEST_USER_RESPONSE } from '../../test/fetchMock.ts'
import { renderRoute } from '../../test/renderRoute.tsx'
import { taskDetail } from '../tasks/detail/testFixtures.ts'

const AUTH_RESPONSE = {
  token: 'new-token',
  expiresAt: '2026-10-07T12:00:00Z',
  user: { id: TEST_USER_RESPONSE.id, name: TEST_USER_RESPONSE.name, email: TEST_USER_RESPONSE.email },
}

/**
 * Stubs the session, the dashboard, `GET /tasks/t1`, sign-in, and `POST /ai/chat` with `chat`
 * (by default, a reply that echoes the message). Returns the chat requests seen.
 */
function stubApi(chat: (request: ChatRequest) => Response | Promise<Response> = echo, tasks: (query: string) => Response | undefined = () => undefined) {
  const chatRequests: ChatRequest[] = []
  stubFetch(({ method, path, body }) => {
    const taskResponse = path.startsWith('/v1/tasks?') ? tasks(path.split('?')[1]) : undefined
    if (taskResponse) {
      return taskResponse
    }
    if (method === 'POST' && path === '/v1/ai/chat') {
      chatRequests.push(body as ChatRequest)
      return chat(body as ChatRequest)
    }
    if (path === '/v1/users/me') {
      return jsonResponse(TEST_USER_RESPONSE)
    }
    if (path === '/v1/auth/signin') {
      return jsonResponse(AUTH_RESPONSE)
    }
    if (path === '/v1/tasks/t1') {
      return jsonResponse(taskDetail('t1'))
    }
    return dashboardResponse(path) ?? problemResponse(500, 'INTERNAL_ERROR')
  })
  return chatRequests
}

function echo({ message }: ChatRequest): Response {
  return jsonResponse({ reply: `Reply to ${message}` })
}

/** Lands on the dashboard with a session and opens the panel. */
async function openPanel(path = '/') {
  const user = userEvent.setup()
  const rendered = renderRoute(path, { token: 'stored-token' })
  await user.click(await screen.findByRole('button', { name: 'Open the assistant' }))
  return { user, ...rendered }
}

async function ask(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByLabelText('Your question'), text)
  await user.click(screen.getByRole('button', { name: 'Send' }))
}

function listedMessages(): string[] {
  const list = screen.queryByRole('list', { name: 'Conversation' })
  return list ? within(list).getAllByRole('listitem').map((item) => item.textContent ?? '') : []
}

describe('ChatPanel', () => {
  it('is collapsed by default, and opens to an empty state with example questions', async () => {
    const user = userEvent.setup()
    stubApi()
    renderRoute('/', { token: 'stored-token' })

    const toggle = await screen.findByRole('button', { name: 'Open the assistant' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByLabelText('Your question')).toBeNull()

    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Close the assistant' }).getAttribute('aria-expanded')).toBe('true')
    await user.click(screen.getByRole('button', { name: 'Do I have overdue tasks?' }))
    expect((screen.getByLabelText('Your question') as HTMLTextAreaElement).value).toBe('Do I have overdue tasks?')
    expect(screen.getByLabelText('Your question').getAttribute('maxlength')).toBe('1000')
  })

  it('sends the trimmed message and shows it with the reply, then clears the input', async () => {
    const requests = stubApi()
    const { user } = await openPanel()

    await ask(user, '  Do I have overdue tasks?  ')

    await waitFor(() => expect(listedMessages()).toHaveLength(2))
    expect(listedMessages()).toEqual(['You: Do I have overdue tasks?', 'Assistant: Reply to Do I have overdue tasks?'])
    expect(requests).toEqual([{ message: 'Do I have overdue tasks?', history: [] }])
    expect((screen.getByLabelText('Your question') as HTMLTextAreaElement).value).toBe('')
  })

  it('sends with Enter, and Shift+Enter adds a new line instead', async () => {
    const requests = stubApi()
    const { user } = await openPanel()

    await user.type(screen.getByLabelText('Your question'), 'line one{Shift>}{Enter}{/Shift}line two{Enter}')

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0].message).toBe('line one\nline two')
  })

  it('sends the last 10 messages as history, in order, with their roles', async () => {
    const requests = stubApi()
    const { user } = await openPanel()

    for (let i = 1; i <= 6; i++) {
      await ask(user, `Question ${i}`)
      await waitFor(() => expect(listedMessages()).toHaveLength(i * 2))
    }
    await ask(user, 'Question 7')

    await waitFor(() => expect(requests).toHaveLength(7))
    const expected = [2, 3, 4, 5, 6].flatMap((i) => [
      { role: 'user', content: `Question ${i}` },
      { role: 'assistant', content: `Reply to Question ${i}` },
    ])
    expect(requests[6]).toEqual({ message: 'Question 7', history: expected })
  })

  it('on a failed send keeps the input, shows the localized message, and adds nothing', async () => {
    let status = 503
    const requests = stubApi(() => problemResponse(status, status === 503 ? 'AI_UNAVAILABLE' : 'AI_RATE_LIMITED'))
    const { user } = await openPanel()

    await ask(user, 'Do I have overdue tasks?')

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe(i18n.t('errors:AI_UNAVAILABLE'))
    expect((screen.getByLabelText('Your question') as HTMLTextAreaElement).value).toBe('Do I have overdue tasks?')
    expect(listedMessages()).toEqual([])

    status = 429
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(requests).toHaveLength(2))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(i18n.t('errors:AI_RATE_LIMITED')))
    expect((screen.getByLabelText('Your question') as HTMLTextAreaElement).value).toBe('Do I have overdue tasks?')
    expect(listedMessages()).toEqual([])
  })

  it('shows the typing indicator and sends nothing more while a reply is pending', async () => {
    let resolve: (response: Response) => void = () => undefined
    const requests = stubApi(() => new Promise<Response>((done) => (resolve = done)))
    const { user } = await openPanel()

    await ask(user, 'First')

    expect(await screen.findByRole('status')).toBeDefined()
    expect(screen.getByText('The assistant is typing…')).toBeDefined()
    const send = screen.getByRole('button', { name: 'Send' })
    expect(send).toHaveProperty('disabled', true)
    await user.click(send)
    await user.type(screen.getByLabelText('Your question'), '{Enter}')
    expect(requests).toHaveLength(1)

    resolve(jsonResponse({ reply: 'Done' }))

    await waitFor(() => expect(listedMessages()).toEqual(['You: First', 'Assistant: Done']))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it("can't send a blank or whitespace-only message", async () => {
    const requests = stubApi()
    const { user } = await openPanel()

    const send = screen.getByRole('button', { name: 'Send' })
    expect(send).toHaveProperty('disabled', true)
    await user.type(screen.getByLabelText('Your question'), '   ')
    expect(send).toHaveProperty('disabled', true)
    await user.type(screen.getByLabelText('Your question'), '{Enter}')
    await user.click(send)

    expect(requests).toHaveLength(0)
  })

  it('"Clear chat" empties the conversation', async () => {
    stubApi()
    const { user } = await openPanel()
    await ask(user, 'Hello')
    await waitFor(() => expect(listedMessages()).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: 'Clear chat' }))

    expect(listedMessages()).toEqual([])
    expect(screen.getByText('What shall we organize?')).toBeDefined()
  })

  it('keeps the conversation when navigating between protected pages', async () => {
    stubApi()
    const { user, router } = await openPanel()
    await ask(user, 'Hello')
    await waitFor(() => expect(listedMessages()).toHaveLength(2))

    await act(() => router.navigate('/tasks/t1'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Task t1' })).toBeDefined()

    expect(listedMessages()).toEqual(['You: Hello', 'Assistant: Reply to Hello'])
  })

  it('is empty again after logging out and back in', async () => {
    stubApi()
    const { user } = await openPanel()
    await ask(user, 'Hello')
    await waitFor(() => expect(listedMessages()).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: 'Log out' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Log in' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Open the assistant' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Close the assistant' })).toBeNull()

    await user.type(screen.getByLabelText(/^Email$/), 'ana@example.com')
    await user.type(screen.getByLabelText(/^Password$/), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await user.click(await screen.findByRole('button', { name: 'Open the assistant' }))

    expect(listedMessages()).toEqual([])
    expect(screen.getByText('What shall we organize?')).toBeDefined()
  })

  it('introduces the open tasks and the next one, which links to its page', async () => {
    const next = taskDetail('n1', { title: 'Call the bank', priority: 'HIGH', dueDate: '2026-12-20' })
    stubApi(echo, (query) => {
      const params = new URLSearchParams(query)
      if (params.get('size') !== '1' || params.getAll('status').join() !== 'TODO,IN_PROGRESS,OVERDUE') {
        return undefined
      }
      return jsonResponse({ content: [next], page: 0, size: 1, totalElements: 5, totalPages: 5 })
    })
    const { router } = await openPanel()

    const panel = within(screen.getByRole('region', { name: 'Assistant' }))
    expect(await panel.findByText((_, element) => element?.textContent === 'You have 5 open tasks. How about starting with a small step?')).toBeDefined()
    expect(panel.getByText('Your next step')).toBeDefined()
    expect(panel.getByText('Call the bank')).toBeDefined()
    expect(panel.getByText('high priority', { exact: false })).toBeDefined()

    await userEvent.setup().click(panel.getByRole('link', { name: 'View task' }))
    expect(router.state.location.pathname).toBe('/tasks/n1')
  })

  it('shows no next step when nothing is open', async () => {
    stubApi()
    await openPanel()

    expect(await screen.findByText('You have no open tasks. Ask anything about your plans.')).toBeDefined()
    expect(screen.queryByText('Your next step')).toBeNull()
  })

  it('hides with its close button and keeps the conversation for the next time', async () => {
    stubApi()
    const { user } = await openPanel()
    await ask(user, 'Hello')
    await waitFor(() => expect(listedMessages()).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: 'Hide the assistant' }))
    expect(screen.queryByRole('region', { name: 'Assistant' })).toBeNull()
    const toggle = screen.getByRole('button', { name: 'Open the assistant' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    await user.click(toggle)
    expect(listedMessages()).toEqual(['You: Hello', 'Assistant: Reply to Hello'])
  })

  it('is not rendered on /login', async () => {
    stubApi()
    renderRoute('/login')

    expect(await screen.findByRole('heading', { level: 1, name: 'Log in' })).toBeDefined()
    expect(screen.queryByRole('region', { name: 'Assistant' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Open the assistant' })).toBeNull()
  })

  it('shows its text in PT-BR', async () => {
    stubApi()
    await i18n.changeLanguage('pt-BR')
    renderRoute('/', { token: 'stored-token' })

    expect(await screen.findByRole('button', { name: 'Abrir o assistente' })).toBeDefined()
  })
})
