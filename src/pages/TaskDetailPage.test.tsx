import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { TaskDetail } from '../api/tasks.ts'
import { taskDetail } from '../features/tasks/detail/testFixtures.ts'
import i18n from '../i18n/index.ts'
import { dashboardResponse, jsonResponse, problemResponse, stubFetch, TEST_USER_RESPONSE } from '../test/fetchMock.ts'
import { renderRoute } from '../test/renderRoute.tsx'

type Request = { method: string; path: string; body: unknown }

interface StubOptions {
  /** Overrides the response to a write (`PATCH`, `DELETE`, `POST .../subtasks`). */
  write?: (request: Request) => Response | undefined
}

/**
 * A tiny fake API over `tasks`: `GET /tasks/{id}` serves them (404 `TASK_NOT_FOUND` otherwise),
 * `PATCH` merges the body, `DELETE` removes the task, and `POST .../subtasks` appends summaries.
 */
function stubApi(tasks: TaskDetail[], { write }: StubOptions = {}) {
  const store = new Map(tasks.map((task) => [task.id, task]))
  const requests: Request[] = []
  stubFetch(({ method, path, body }) => {
    const request = { method, path, body }
    requests.push(request)
    if (path === '/v1/users/me') {
      return jsonResponse(TEST_USER_RESPONSE)
    }
    const dashboard = dashboardResponse(path)
    if (dashboard) {
      return dashboard
    }
    const match = /^\/v1\/tasks\/([^/]+)(\/subtasks)?$/.exec(path)
    if (!match) {
      return problemResponse(500, 'INTERNAL_ERROR')
    }
    const id = decodeURIComponent(match[1])
    const task = store.get(id)
    if (!task) {
      return problemResponse(404, 'TASK_NOT_FOUND')
    }
    if (method !== 'GET') {
      const override = write?.(request)
      if (override) {
        return override
      }
    }
    if (method === 'GET') {
      return jsonResponse(task)
    }
    if (method === 'PATCH') {
      const updated = { ...task, ...(body as Partial<TaskDetail>), updatedAt: '2026-10-08T09:00:00Z' }
      store.set(id, updated)
      return jsonResponse(updated)
    }
    if (method === 'DELETE') {
      store.delete(id)
      return new Response(null, { status: 204 })
    }
    if (method === 'POST' && match[2]) {
      const created = (body as { title: string }[]).map((item, index) => ({
        ...taskDetail(`${id}-new-${task.subtasks.length + index}`, item),
        parentTaskId: id,
      }))
      const summaries = created.map(({ id: subId, title, status, priority, dueDate }) => ({
        id: subId,
        title,
        status,
        priority,
        dueDate,
        subtaskCount: 0,
      }))
      store.set(id, { ...task, subtasks: [...task.subtasks, ...summaries] })
      return jsonResponse(created, 201)
    }
    return problemResponse(500, 'INTERNAL_ERROR')
  })
  const writes = () => requests.filter(({ method }) => method !== 'GET')
  return { requests, writes, store }
}

function renderTask(id: string) {
  return renderRoute(`/tasks/${id}`, { token: 'stored-token' })
}

const ROOT = taskDetail('root', { title: 'Launch website' })
const MIDDLE = taskDetail('middle', {
  title: 'Build pages',
  parentTaskId: 'root',
  ancestors: [{ id: 'root', title: 'Launch website' }],
})
const LEAF = taskDetail('leaf', {
  title: 'Contact page',
  description: 'Form and map',
  dueDate: '2026-10-01',
  priority: 'HIGH',
  status: 'OVERDUE',
  complexity: 'HARD',
  parentTaskId: 'middle',
  ancestors: [
    { id: 'root', title: 'Launch website' },
    { id: 'middle', title: 'Build pages' },
  ],
  subtasks: [
    { id: 's2', title: 'Second', status: 'DONE', priority: 'LOW', dueDate: null, subtaskCount: 0 },
    { id: 's1', title: 'First', status: 'TODO', priority: 'MEDIUM', dueDate: '2026-11-02', subtaskCount: 3 },
  ],
})

async function heading(name: string) {
  return screen.findByRole('heading', { level: 1, name })
}

describe('TaskDetailPage', () => {
  it('shows every field, the breadcrumb root first, and the subtasks in API order', async () => {
    stubApi([LEAF])
    renderTask('leaf')

    await heading('Contact page')
    const breadcrumb = screen.getByRole('navigation', { name: 'Parent tasks' })
    const crumbs = within(breadcrumb).getAllByRole('link')
    expect(crumbs.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Launch website', '/tasks/root'],
      ['Build pages', '/tasks/middle'],
    ])

    const main = within(screen.getByRole('main'))
    expect(main.getByText('Form and map')).toBeDefined()
    expect(main.getAllByText('Overdue').length).toBeGreaterThan(0)
    expect(main.getByText('High')).toBeDefined()
    expect(main.getByText('Hard')).toBeDefined()
    expect(main.getByText('Oct 1, 2026')).toBeDefined()

    const subtasks = within(screen.getByRole('region', { name: 'Subtasks' }))
    const items = subtasks.getAllByRole('listitem')
    expect(items.map((item) => within(item).getByRole('link').textContent)).toEqual(['Second', 'First'])
    expect(within(items[1]).getByRole('link').getAttribute('href')).toBe('/tasks/s1')
    // The count shows only when non-zero.
    expect(within(items[1]).getByText('3 subtasks')).toBeDefined()
    expect(within(items[0]).queryByText(/subtask/)).toBeNull()
  })

  it('shows no breadcrumb for a top-level task and an empty subtask list', async () => {
    stubApi([ROOT])
    renderTask('root')

    await heading('Launch website')
    expect(screen.queryByRole('navigation', { name: 'Parent tasks' })).toBeNull()
    expect(screen.getByText('No subtasks yet.')).toBeDefined()
  })

  it('shows a not-found state for TASK_NOT_FOUND', async () => {
    stubApi([])
    renderTask('missing')

    expect(await heading('Task not found')).toBeDefined()
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Back to your tasks' }).getAttribute('href')).toBe('/')
  })

  it('shows the not-found state in PT-BR', async () => {
    await i18n.changeLanguage('pt-BR')
    stubApi([])
    renderTask('missing')

    expect(await heading('Tarefa não encontrada')).toBeDefined()
  })

  describe('edit', () => {
    it('sends only the changed fields, with null for a cleared due date and complexity', async () => {
      const user = userEvent.setup()
      const task = taskDetail('t1', {
        title: 'Write report',
        description: 'Numbers',
        dueDate: '2026-12-01',
        priority: 'LOW',
        status: 'IN_PROGRESS',
        complexity: 'EASY',
      })
      const { writes } = stubApi([task])
      renderTask('t1')

      await user.click(await screen.findByRole('button', { name: 'Edit' }))
      const form = within(screen.getByRole('form', { name: 'Edit task' }))
      await user.clear(form.getByLabelText('Title'))
      await user.type(form.getByLabelText('Title'), 'Write the report')
      fireEvent.change(form.getByLabelText('Due date'), { target: { value: '' } })
      await user.selectOptions(form.getByLabelText('Complexity'), 'Not estimated')
      await user.selectOptions(form.getByLabelText('Status'), 'Done')
      await user.click(form.getByRole('button', { name: 'Save changes' }))

      expect(await heading('Write the report')).toBeDefined()
      expect(writes()).toEqual([
        { method: 'PATCH', path: '/v1/tasks/t1', body: { title: 'Write the report', dueDate: null, complexity: null, status: 'DONE' } },
      ])
      expect(screen.queryByRole('form', { name: 'Edit task' })).toBeNull()
    })

    it('rejects hours 0, 1000 and 2.5 without calling the API', async () => {
      const user = userEvent.setup()
      const { writes } = stubApi([taskDetail('t1', { estimatedHours: 5 })])
      renderTask('t1')

      await user.click(await screen.findByRole('button', { name: 'Edit' }))
      const form = within(screen.getByRole('form', { name: 'Edit task' }))
      const hours = form.getByLabelText('Estimated hours')
      expect(hours).toHaveProperty('value', '5')
      for (const value of ['0', '1000', '2.5']) {
        await user.clear(hours)
        await user.type(hours, value)
        await user.click(form.getByRole('button', { name: 'Save changes' }))
        expect(form.getByText('Enter a whole number of hours from 1 to 999.')).toBeDefined()
        expect(hours.getAttribute('aria-invalid')).toBe('true')
      }
      expect(writes()).toEqual([])
    })

    it('sends estimatedHours: null when the hours are cleared, and shows "Not estimated"', async () => {
      const user = userEvent.setup()
      const { writes } = stubApi([taskDetail('t1', { title: 'Write report', estimatedHours: 5 })])
      renderTask('t1')

      await heading('Write report')
      const fields = within(screen.getByRole('main'))
      expect(fields.getByText('5 hours')).toBeDefined()
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      const form = within(screen.getByRole('form', { name: 'Edit task' }))
      await user.clear(form.getByLabelText('Estimated hours'))
      await user.click(form.getByRole('button', { name: 'Save changes' }))

      await waitFor(() => expect(screen.queryByRole('form', { name: 'Edit task' })).toBeNull())
      expect(writes()).toEqual([{ method: 'PATCH', path: '/v1/tasks/t1', body: { estimatedHours: null } }])
      // Complexity is also "Not estimated" here, so expect both.
      expect(fields.getAllByText('Not estimated')).toHaveLength(2)
      expect(fields.queryByText('5 hours')).toBeNull()
    })

    it('shows the hours in PT-BR', async () => {
      await i18n.changeLanguage('pt-BR')
      stubApi([taskDetail('t1', { title: 'Write report', estimatedHours: 1, complexity: 'EASY' })])
      renderTask('t1')

      await heading('Write report')
      expect(within(screen.getByRole('main')).getByText('1 hora')).toBeDefined()
      expect(within(screen.getByRole('main')).getByText('Horas estimadas')).toBeDefined()
    })

    it('saves an OVERDUE task without sending its status', async () => {
      const user = userEvent.setup()
      const { writes } = stubApi([LEAF])
      renderTask('leaf')

      await user.click(await screen.findByRole('button', { name: 'Edit' }))
      const form = within(screen.getByRole('form', { name: 'Edit task' }))
      const status = form.getByLabelText('Status') as HTMLSelectElement
      // OVERDUE is shown as the current status but can't be picked (D6).
      expect(status.value).toBe('OVERDUE')
      const options = within(status).getAllByRole('option') as HTMLOptionElement[]
      expect(options.map((option) => [option.value, option.disabled])).toEqual([
        ['OVERDUE', true],
        ['TODO', false],
        ['IN_PROGRESS', false],
        ['DONE', false],
      ])
      fireEvent.change(form.getByLabelText('Due date'), { target: { value: '2026-12-31' } })
      await user.click(form.getByRole('button', { name: 'Save changes' }))

      await waitFor(() => expect(writes()).toHaveLength(1))
      expect(writes()[0]).toEqual({ method: 'PATCH', path: '/v1/tasks/leaf', body: { dueDate: '2026-12-31' } })
    })

    it('leaves edit mode without a request when nothing changed', async () => {
      const user = userEvent.setup()
      const { writes } = stubApi([LEAF])
      renderTask('leaf')

      await user.click(await screen.findByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: 'Save changes' }))

      expect(screen.queryByRole('form', { name: 'Edit task' })).toBeNull()
      expect(screen.getByRole('button', { name: 'Edit' })).toBeDefined()
      expect(writes()).toEqual([])
    })

    it('shows server validation errors on the matching fields and stays in edit mode', async () => {
      const user = userEvent.setup()
      stubApi([ROOT], {
        write: () => problemResponse(400, 'VALIDATION_ERROR', [{ field: 'description', message: 'must not be blank' }]),
      })
      renderTask('root')

      await user.click(await screen.findByRole('button', { name: 'Edit' }))
      const form = within(screen.getByRole('form', { name: 'Edit task' }))
      await user.type(form.getByLabelText('Description'), ' more')
      await user.click(form.getByRole('button', { name: 'Save changes' }))

      expect(await form.findByText('Enter a description of at most 500 characters.')).toBeDefined()
      expect(form.getByLabelText('Description').getAttribute('aria-invalid')).toBe('true')
    })
  })

  describe('subtasks', () => {
    it('offers the add-subtask form on a subtask that can have subtasks, and adds one', async () => {
      const user = userEvent.setup()
      const { writes } = stubApi([MIDDLE])
      renderTask('middle')

      await heading('Build pages')
      const section = within(screen.getByRole('region', { name: 'Subtasks' }))
      await user.click(section.getByRole('button', { name: 'Add a subtask' }))
      const form = within(section.getByRole('form', { name: 'New subtask' }))
      // Subtask create takes no estimate (wave 4, D10).
      expect(form.queryByLabelText('Estimated hours')).toBeNull()
      await user.type(form.getByLabelText('Title'), 'About page')
      await user.type(form.getByLabelText('Description'), 'Team bios')
      await user.click(form.getByRole('button', { name: 'Add subtask' }))

      expect(await section.findByRole('link', { name: 'About page' })).toBeDefined()
      expect(writes()).toEqual([
        { method: 'POST', path: '/v1/tasks/middle/subtasks', body: [{ title: 'About page', description: 'Team bios', priority: 'MEDIUM' }] },
      ])
      // The form is cleared and stays open for the next one.
      const nextForm = within(section.getByRole('form', { name: 'New subtask' }))
      expect((nextForm.getByLabelText('Title') as HTMLInputElement).value).toBe('')
    })

    it('hides the add-subtask form when canAddSubtasks is false', async () => {
      stubApi([{ ...LEAF, canAddSubtasks: false }])
      renderTask('leaf')

      await heading('Contact page')
      const section = within(screen.getByRole('region', { name: 'Subtasks' }))
      expect(section.queryByRole('button', { name: 'Add a subtask' })).toBeNull()
      expect(section.queryByRole('form')).toBeNull()
      expect(section.getByText("This task is at the maximum depth, so it can't have subtasks.")).toBeDefined()
    })

    it('shows SUBTASK_DEPTH_EXCEEDED above the form buttons', async () => {
      const user = userEvent.setup()
      stubApi([MIDDLE], { write: () => problemResponse(400, 'SUBTASK_DEPTH_EXCEEDED') })
      renderTask('middle')

      await user.click(await screen.findByRole('button', { name: 'Add a subtask' }))
      const form = within(screen.getByRole('form', { name: 'New subtask' }))
      await user.type(form.getByLabelText('Title'), 'Too deep')
      await user.type(form.getByLabelText('Description'), 'Nope')
      await user.click(form.getByRole('button', { name: 'Add subtask' }))

      expect((await form.findByRole('alert')).textContent).toBe(
        "This task is at the maximum depth, so it can't get more subtasks.",
      )
    })
  })

  describe('delete', () => {
    it('asks for confirmation, then deletes and goes to the parent', async () => {
      const user = userEvent.setup()
      const { writes } = stubApi([MIDDLE, LEAF])
      const { router } = renderTask('leaf')

      await user.click(await screen.findByRole('button', { name: 'Delete' }))
      const dialog = within(screen.getByRole('alertdialog', { name: 'Delete this task?' }))
      expect(dialog.getByText(/“Contact page” and all of its subtasks/)).toBeDefined()
      expect(writes()).toEqual([])

      await user.click(dialog.getByRole('button', { name: 'Delete' }))

      expect(await heading('Build pages')).toBeDefined()
      expect(router.state.location.pathname).toBe('/tasks/middle')
      expect(writes()).toEqual([{ method: 'DELETE', path: '/v1/tasks/leaf', body: undefined }])
    })

    it('does nothing when the confirmation is cancelled', async () => {
      const user = userEvent.setup()
      const { writes } = stubApi([LEAF])
      const { router } = renderTask('leaf')

      await user.click(await screen.findByRole('button', { name: 'Delete' }))
      await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('alertdialog')).toBeNull()
      expect(router.state.location.pathname).toBe('/tasks/leaf')
      expect(writes()).toEqual([])
    })

    it('goes to the dashboard after deleting a top-level task', async () => {
      const user = userEvent.setup()
      stubApi([ROOT])
      const { router } = renderTask('root')

      await user.click(await screen.findByRole('button', { name: 'Delete' }))
      await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))

      expect(await heading('Your tasks')).toBeDefined()
      expect(router.state.location.pathname).toBe('/')
    })

    it('keeps the dialog open with the error when the delete fails', async () => {
      const user = userEvent.setup()
      stubApi([ROOT], { write: () => problemResponse(500, 'INTERNAL_ERROR') })
      const { router } = renderTask('root')

      await user.click(await screen.findByRole('button', { name: 'Delete' }))
      const dialog = within(screen.getByRole('alertdialog'))
      await user.click(dialog.getByRole('button', { name: 'Delete' }))

      expect((await dialog.findByRole('alert')).textContent).toBe('Something went wrong on our side. Try again.')
      expect(router.state.location.pathname).toBe('/tasks/root')
    })
  })
})
