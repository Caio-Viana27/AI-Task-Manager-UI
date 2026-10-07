import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { SubtaskDraft } from '../../../api/aiBreakdown.ts'
import type { TaskDetail } from '../../../api/tasks.ts'
import { jsonResponse, problemResponse, stubFetch, TEST_USER_RESPONSE } from '../../../test/fetchMock.ts'
import { renderRoute } from '../../../test/renderRoute.tsx'
import { taskDetail } from '../../tasks/detail/testFixtures.ts'

type Request = { method: string; path: string; body: unknown }

const DRAFTS: SubtaskDraft[] = [
  { title: 'Collect numbers', description: 'Export sales', priority: 'HIGH', complexity: 'EASY' },
  { title: 'Draft summary', description: 'Write it', priority: 'MEDIUM', complexity: 'MEDIUM' },
  { title: 'Review', description: 'Ask a peer', priority: 'LOW', complexity: 'EASY' },
]

interface StubOptions {
  breakdown?: () => Response
  /** The `POST /tasks/{id}/subtasks` response; by default the created tasks. */
  create?: () => Response | Promise<Response>
}

/** Stubs the session, the task page for `task`, the breakdown, and subtask creation. */
function stubApi(task: TaskDetail, { breakdown = () => jsonResponse(DRAFTS), create }: StubOptions = {}) {
  const requests: Request[] = []
  stubFetch(({ method, path, body }) => {
    requests.push({ method, path, body })
    if (path === '/v1/users/me') {
      return jsonResponse(TEST_USER_RESPONSE)
    }
    if (method === 'GET' && path === `/v1/tasks/${task.id}`) {
      return jsonResponse(task)
    }
    if (method === 'POST' && path === `/v1/tasks/${task.id}/ai/breakdown`) {
      return breakdown()
    }
    if (method === 'POST' && path === `/v1/tasks/${task.id}/subtasks`) {
      if (create) {
        return create()
      }
      const created = (body as SubtaskDraft[]).map((item, index) => ({
        ...taskDetail(`new-${index}`, item),
        parentTaskId: task.id,
      }))
      return jsonResponse(created, 201)
    }
    return problemResponse(500, 'INTERNAL_ERROR')
  })
  return {
    breakdowns: () => requests.filter(({ path }) => path.endsWith('/ai/breakdown')),
    creates: () => requests.filter(({ path }) => path.endsWith('/subtasks')).map(({ body }) => body),
  }
}

async function openDrafts() {
  const user = userEvent.setup()
  renderRoute('/tasks/t1', { token: 'stored-token' })
  await user.click(await screen.findByRole('button', { name: 'Break down with AI' }))
  const editor = within(await screen.findByRole('group', { name: 'Suggested subtasks' }))
  return { user, editor }
}

describe('AiBreakdownSlot', () => {
  it('is hidden when the task is at the maximum depth', async () => {
    stubApi(taskDetail('t1', { title: 'Deep task', canAddSubtasks: false }))
    renderRoute('/tasks/t1', { token: 'stored-token' })

    expect(await screen.findByRole('heading', { level: 1, name: 'Deep task' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Break down with AI' })).toBeNull()
  })

  it('creates the edited, remaining drafts in the new order', async () => {
    const { creates } = stubApi(taskDetail('t1'))
    const { user, editor } = await openDrafts()

    const first = within(editor.getByRole('listitem', { name: 'Draft 1' }))
    await user.clear(first.getByLabelText('Title'))
    await user.type(first.getByLabelText('Title'), '  Gather numbers ')
    await user.selectOptions(first.getByLabelText('Priority'), 'Low')
    await user.click(editor.getByRole('button', { name: 'Remove draft 2' }))
    // Now: Gather numbers, Review. Move Review to the top.
    await user.click(editor.getByRole('button', { name: 'Move draft 2 up' }))
    await user.click(editor.getByRole('button', { name: 'Create 2 subtasks' }))

    expect(await screen.findByRole('button', { name: 'Break down with AI' })).toBeDefined()
    expect(screen.queryByRole('group', { name: 'Suggested subtasks' })).toBeNull()
    expect(creates()).toEqual([
      [
        { title: 'Review', description: 'Ask a peer', priority: 'LOW', complexity: 'EASY' },
        { title: 'Gather numbers', description: 'Export sales', priority: 'LOW', complexity: 'EASY' },
      ],
    ])
  })

  it('blocks creating while a draft is invalid or the list is empty', async () => {
    stubApi(taskDetail('t1'))
    const { user, editor } = await openDrafts()

    await user.clear(within(editor.getByRole('listitem', { name: 'Draft 1' })).getByLabelText('Title'))
    expect(editor.getByText('Enter a title.')).toBeDefined()
    expect(editor.getByRole('button', { name: 'Create 3 subtasks' })).toHaveProperty('disabled', true)

    for (let i = 0; i < 3; i++) {
      await user.click(editor.getByRole('button', { name: 'Remove draft 1' }))
    }
    expect(editor.getByRole('button', { name: 'Create 0 subtasks' })).toHaveProperty('disabled', true)
  })

  it('a second click while creating sends nothing', async () => {
    let release: (response: Response) => void = () => {}
    const { creates } = stubApi(taskDetail('t1'), {
      create: () => new Promise<Response>((resolve) => (release = resolve)),
    })
    const { user, editor } = await openDrafts()

    await user.click(editor.getByRole('button', { name: 'Create 3 subtasks' }))
    const creating = editor.getByRole('button', { name: 'Creating…' })
    expect(creating).toHaveProperty('disabled', true)
    await user.click(creating)
    release(jsonResponse([], 201))

    expect(await screen.findByRole('button', { name: 'Break down with AI' })).toBeDefined()
    expect(creates()).toHaveLength(1)
  })

  it('keeps the drafts when creating fails', async () => {
    stubApi(taskDetail('t1'), { create: () => problemResponse(500, 'INTERNAL_ERROR') })
    const { user, editor } = await openDrafts()

    await user.click(editor.getByRole('button', { name: 'Create 3 subtasks' }))

    expect(await editor.findByText('Something went wrong on our side. Try again.')).toBeDefined()
    expect(editor.getAllByRole('listitem')).toHaveLength(3)
  })

  it('shows the localized unavailable message on a 503', async () => {
    const user = userEvent.setup()
    const { breakdowns } = stubApi(taskDetail('t1'), { breakdown: () => problemResponse(503, 'AI_UNAVAILABLE') })
    renderRoute('/tasks/t1', { token: 'stored-token' })

    await user.click(await screen.findByRole('button', { name: 'Break down with AI' }))

    expect(await screen.findByText('The AI assistant is unavailable right now. Try again in a moment.')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Break down with AI' })).toHaveProperty('disabled', false)
    expect(breakdowns()).toHaveLength(1)
  })

  it('"Discard" closes the drafts without creating anything', async () => {
    const { creates } = stubApi(taskDetail('t1'))
    const { user, editor } = await openDrafts()

    await user.click(editor.getByRole('button', { name: 'Discard' }))

    expect(screen.queryByRole('group', { name: 'Suggested subtasks' })).toBeNull()
    expect(creates()).toEqual([])
  })
})
