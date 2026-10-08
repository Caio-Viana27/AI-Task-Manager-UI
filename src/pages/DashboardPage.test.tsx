import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PageResponse, Task } from '../api/tasks.ts'
import i18n from '../i18n/index.ts'
import { EMPTY_TASK_PAGE, jsonResponse, problemResponse, stubFetch, TEST_LOOKUPS, TEST_USER_RESPONSE } from '../test/fetchMock.ts'
import { renderRoute } from '../test/renderRoute.tsx'

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Task ${id}`,
    description: 'Description',
    dueDate: null,
    priority: 'MEDIUM',
    status: 'TODO',
    complexity: null,
    parentTaskId: null,
    createdAt: '2026-10-07T12:00:00Z',
    updatedAt: '2026-10-07T12:00:00Z',
    ...overrides,
  }
}

function page(content: Task[], overrides: Partial<PageResponse<Task>> = {}): PageResponse<Task> {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: content.length > 0 ? 1 : 0, ...overrides }
}

type Request = { method: string; path: string; body: unknown }

interface StubOptions {
  /** The list page for a `GET /tasks` query string. */
  list?: (query: URLSearchParams) => PageResponse<Task> | Response | Promise<Response>
  /** The response to `PATCH /tasks/{id}`. */
  patch?: (id: string, body: unknown) => Response | Promise<Response>
  /** The total for a count query (`size=1`) from the sidebar, tabs or stats. */
  count?: (query: URLSearchParams) => number
}

/** Stubs the session, the lookups, the list and the patch, and records every request. */
function stubApi({ list = () => page([]), patch, count = () => 0 }: StubOptions = {}) {
  const requests: Request[] = []
  const fetchMock = stubFetch(({ method, path, body }) => {
    requests.push({ method, path, body })
    if (path === '/v1/users/me') {
      return jsonResponse(TEST_USER_RESPONSE)
    }
    if (path === '/v1/lookups') {
      return jsonResponse(TEST_LOOKUPS)
    }
    const [pathname, query = ''] = path.split('?')
    const params = new URLSearchParams(query)
    if (method === 'GET' && pathname === '/v1/tasks' && params.get('size') === '1') {
      return jsonResponse(page([], { totalElements: count(params) }))
    }
    if (method === 'GET' && pathname === '/v1/tasks') {
      const result = list(new URLSearchParams(query))
      return result instanceof Response || result instanceof Promise ? result : jsonResponse(result)
    }
    if (method === 'PATCH' && patch) {
      return patch(decodeURIComponent(pathname.slice('/v1/tasks/'.length)), body)
    }
    if (method === 'DELETE') {
      return new Response(null, { status: 204 })
    }
    return problemResponse(500, 'INTERNAL_ERROR')
  })
  /** The query strings of every `GET /tasks` for the list itself (not the counts), oldest first. */
  const listQueries = () =>
    requests
      .filter(({ method, path }) => method === 'GET' && /^\/v1\/tasks(\?|$)/.test(path))
      .map(({ path }) => path.split('?')[1] ?? '')
      .filter((query) => new URLSearchParams(query).get('size') !== '1')
  return { fetchMock, requests, listQueries }
}

function renderDashboard(path = '/') {
  return renderRoute(path, { token: 'stored-token' })
}

async function openFilters(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /^Filters/ }))
}

async function rowOf(title: string) {
  const link = await screen.findByRole('link', { name: title })
  return link.closest('li') as HTMLElement
}

describe('DashboardPage', () => {
  // Due dates read "Today", "Tomorrow" or a short date relative to this day.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 8, 12))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('lists top-level tasks with their fields, each linking to its page', async () => {
    const { listQueries } = stubApi({
      list: () =>
        page([
          task('a', { title: 'Write report', status: 'OVERDUE', priority: 'HIGH', complexity: 'HARD', dueDate: '2026-10-01' }),
          task('b', { title: 'Plan trip', status: 'DONE', priority: 'LOW' }),
          task('c', { title: 'Call bank', status: 'IN_PROGRESS', dueDate: '2026-10-08', parentTaskId: 'a' }),
          task('d', { title: 'Pay rent', dueDate: '2026-10-09' }),
          task('e', { title: 'File taxes', dueDate: '2027-04-30' }),
        ]),
    })
    renderDashboard()

    const report = await rowOf('Write report')
    expect(within(report).getByRole('link', { name: 'Write report' }).getAttribute('href')).toBe('/tasks/a')
    expect(within(report).getByText('Overdue')).toBeDefined()
    expect(within(report).getByText('High')).toBeDefined()
    expect(within(report).getByText('Oct 1')).toBeDefined()
    expect(within(report).queryByText('Hard')).toBeNull()
    expect(within(report).getByRole('checkbox', { name: 'Mark “Write report” as done' })).toHaveProperty('checked', false)

    const trip = await rowOf('Plan trip')
    expect(within(trip).getByText('No due date')).toBeDefined()
    expect(within(trip).getByRole('checkbox', { name: 'Mark “Plan trip” as not done' })).toHaveProperty('checked', true)

    const call = await rowOf('Call bank')
    expect(within(call).getByText('Today')).toBeDefined()
    expect(within(call).getByText('Subtask')).toBeDefined()
    expect(within(await rowOf('Pay rent')).getByText('Tomorrow')).toBeDefined()
    expect(within(await rowOf('File taxes')).getByText('Apr 30, 2027')).toBeDefined()

    expect(screen.getByText('5 tasks in your space')).toBeDefined()
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Add a task' }).getAttribute('href')).toBe('/tasks/new')
    // Top-level only by default: no includeSubtasks.
    expect(listQueries()).toEqual(['page=0&size=20&sort=dueDate%2Casc'])
  })

  it('the status tabs set the status filter, and go back to page 1', async () => {
    const user = userEvent.setup()
    const { listQueries } = stubApi({ list: () => page([task('a')], { totalElements: 60, totalPages: 3 }) })
    const { router } = renderDashboard('/?page=2')
    await rowOf('Task a')
    expect(screen.getByRole('button', { name: 'All' }).getAttribute('aria-pressed')).toBe('true')

    await user.click(screen.getByRole('button', { name: 'Completed' }))

    expect(router.state.location.search).toBe('?status=DONE')
    await waitFor(() => expect(listQueries().at(-1)).toBe('status=DONE&page=0&size=20&sort=dueDate%2Casc'))
    expect(listQueries()[0]).toBe('page=1&size=20&sort=dueDate%2Casc')
    expect(screen.getByRole('button', { name: 'Completed' }).getAttribute('aria-pressed')).toBe('true')

    // "To do" includes overdue tasks.
    await user.click(screen.getByRole('button', { name: 'To do' }))
    expect(router.state.location.search).toBe('?status=TODO&status=OVERDUE')

    await user.click(screen.getByRole('button', { name: 'In progress' }))
    expect(router.state.location.search).toBe('?status=IN_PROGRESS')

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(router.state.location.search).toBe('')
  })

  it('the filters panel picks any mix of statuses, which no tab then shows as active', async () => {
    const user = userEvent.setup()
    stubApi({ list: () => page([task('a')]) })
    const { router } = renderDashboard()
    await rowOf('Task a')
    expect(screen.queryByRole('checkbox', { name: 'Done' })).toBeNull()

    await openFilters(user)
    await user.click(await screen.findByRole('checkbox', { name: 'Done' }))
    await user.click(screen.getByRole('checkbox', { name: 'Overdue' }))

    // The selection keeps the lookup order, whatever order it was clicked in.
    expect(router.state.location.search).toBe('?status=OVERDUE&status=DONE')
    for (const name of ['All', 'To do', 'In progress', 'Completed']) {
      expect(screen.getByRole('button', { name }).getAttribute('aria-pressed')).toBe('false')
    }
    expect(screen.getByRole('button', { name: 'Filters 1 active' })).toBeDefined()
  })

  it('sends priority, complexity, dates, subtasks and sort from the controls', async () => {
    const user = userEvent.setup()
    const { listQueries } = stubApi({ list: () => page([task('a')]) })
    const { router } = renderDashboard()
    await rowOf('Task a')

    await openFilters(user)
    await user.click(await screen.findByRole('checkbox', { name: 'High' }))
    await user.click(screen.getByRole('checkbox', { name: 'Easy' }))
    fireEvent.change(screen.getByLabelText('Due from'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('Due to'), { target: { value: '2026-10-31' } })
    await user.click(screen.getByRole('checkbox', { name: 'Include subtasks' }))
    await user.selectOptions(screen.getByLabelText('Sort by'), 'Priority, high to low')

    const expected = 'priority=HIGH&complexity=EASY&dueFrom=2026-10-01&dueTo=2026-10-31&includeSubtasks=true'
    expect(router.state.location.search).toBe(`?${expected}&sort=priority%2Cdesc`)
    await waitFor(() => expect(listQueries().at(-1)).toBe(`${expected}&page=0&size=20&sort=priority%2Cdesc`))

    fireEvent.change(screen.getByLabelText('Due from'), { target: { value: '' } })
    expect(router.state.location.search).not.toContain('dueFrom')
  })

  it('debounces the text search into the URL and the request', async () => {
    const user = userEvent.setup()
    const { listQueries } = stubApi({ list: () => page([task('a')]) })
    const { router } = renderDashboard()
    await rowOf('Task a')

    await user.type(screen.getByLabelText('Search'), '  50% done ')

    await waitFor(() => expect(router.state.location.search).toBe('?q=50%25+done'))
    await waitFor(() => expect(listQueries().at(-1)).toBe('q=50%25+done&page=0&size=20&sort=dueDate%2Casc'))
    // One request per settled search, not one per keystroke.
    expect(listQueries()).toHaveLength(2)
  })

  it('reads the filters from the URL and drops invalid ones instead of sending them', async () => {
    const { listQueries } = stubApi({ list: () => page([task('a')]) })
    renderDashboard(
      '/?status=OPEN&status=TODO&priority=URGENT&dueFrom=2026-02-30&dueTo=2026-10-31&sort=status,asc&page=-1&includeSubtasks=1&q=%20',
    )
    await rowOf('Task a')

    expect(listQueries()).toEqual(['status=TODO&dueTo=2026-10-31&page=0&size=20&sort=dueDate%2Casc'])
    // TODO alone isn't a tab (the "To do" tab includes OVERDUE), so the panel holds it: 2 filters.
    await openFilters(userEvent.setup())
    expect(screen.getByRole('button', { name: 'Filters 2 active' })).toBeDefined()
    expect(await screen.findByRole('checkbox', { name: 'To do' })).toHaveProperty('checked', true)
    expect(screen.getByLabelText('Due to')).toHaveProperty('value', '2026-10-31')
    expect(screen.getByLabelText('Sort by')).toHaveProperty('value', 'dueDate,asc')
  })

  it('pages through the results and keeps the filters', async () => {
    const user = userEvent.setup()
    const { listQueries } = stubApi({
      list: (query) => page([task(`p${query.get('page')}`)], { page: Number(query.get('page')), totalElements: 41, totalPages: 3 }),
    })
    const { router } = renderDashboard('/?priority=LOW')
    await rowOf('Task p0')
    expect(screen.getByText('Page 1 of 3')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Previous' })).toHaveProperty('disabled', true)

    await user.click(screen.getByRole('button', { name: 'Next' }))

    await rowOf('Task p1')
    expect(router.state.location.search).toBe('?priority=LOW&page=2')
    expect(listQueries().at(-1)).toBe('priority=LOW&page=1&size=20&sort=dueDate%2Casc')
    expect(screen.getByText('Page 2 of 3')).toBeDefined()
  })

  it('the done toggle sends PATCH { status } and updates the row at once', async () => {
    const user = userEvent.setup()
    let current = task('a', { title: 'Write report' })
    let resolvePatch: () => void = () => undefined
    const { requests } = stubApi({
      list: () => page([current]),
      patch: () =>
        new Promise<Response>((resolve) => {
          resolvePatch = () => {
            current = { ...current, status: 'DONE' }
            resolve(jsonResponse(current))
          }
        }),
    })
    renderDashboard()
    const row = await rowOf('Write report')

    await user.click(within(row).getByRole('checkbox', { name: 'Mark “Write report” as done' }))

    // Optimistic: checked and "Done" before the API answers.
    const toggle = within(row).getByRole('checkbox', { name: 'Mark “Write report” as not done' })
    expect(toggle).toHaveProperty('checked', true)
    expect(within(row).getByText('Done')).toBeDefined()
    expect(requests.filter(({ method }) => method === 'PATCH')).toEqual([
      { method: 'PATCH', path: '/v1/tasks/a', body: { status: 'DONE' } },
    ])

    resolvePatch()
    await waitFor(() => expect(toggle).toHaveProperty('disabled', false))
    expect(toggle).toHaveProperty('checked', true)
  })

  it('rolls the toggle back and shows the error when PATCH fails', async () => {
    const user = userEvent.setup()
    let rejectPatch: (response: Response) => void = () => undefined
    let listCalls = 0
    stubApi({
      // Later list fetches never answer, so only the rollback can restore the row.
      list: () =>
        listCalls++ === 0
          ? page([task('a', { title: 'Write report', status: 'IN_PROGRESS' })])
          : new Promise<Response>(() => undefined),
      patch: () => new Promise<Response>((resolve) => (rejectPatch = resolve)),
    })
    renderDashboard()
    const row = await rowOf('Write report')

    await user.click(within(row).getByRole('checkbox', { name: 'Mark “Write report” as done' }))
    expect(within(row).getByText('Done')).toBeDefined()

    rejectPatch(problemResponse(404, 'TASK_NOT_FOUND'))

    expect(await within(row).findByRole('alert')).toBeDefined()
    expect(within(row).getByRole('checkbox', { name: 'Mark “Write report” as done' })).toHaveProperty('checked', false)
    expect(within(row).getByText('In progress')).toBeDefined()
  })

  it('reopening a task shows the status the API returns, which may be OVERDUE', async () => {
    const user = userEvent.setup()
    let current = task('a', { title: 'Write report', status: 'DONE', dueDate: '2026-10-01' })
    const { requests } = stubApi({
      list: () => page([current]),
      patch: () => {
        current = { ...current, status: 'OVERDUE' }
        return jsonResponse(current)
      },
    })
    renderDashboard()
    const row = await rowOf('Write report')

    await user.click(within(row).getByRole('checkbox', { name: 'Mark “Write report” as not done' }))

    expect(await within(row).findByText('Overdue')).toBeDefined()
    expect(within(row).getByRole('checkbox', { name: 'Mark “Write report” as done' })).toHaveProperty('checked', false)
    expect(requests.find(({ method }) => method === 'PATCH')?.body).toEqual({ status: 'TODO' })
  })

  it('shows the empty state with a link to add a task', async () => {
    stubApi({ list: () => EMPTY_TASK_PAGE })
    renderDashboard()

    expect(await screen.findByRole('heading', { name: 'You have no tasks yet' })).toBeDefined()
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('link', { name: 'Add a task' }).getAttribute('href')).toBe('/tasks/new')
    expect(main.getByRole('link', { name: 'New task' }).getAttribute('href')).toBe('/tasks/new')
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull()
  })

  it('shows a filtered empty state that clears the filters but keeps the sort', async () => {
    const user = userEvent.setup()
    stubApi({ list: (query) => (query.has('status') ? page([]) : page([task('a')])) })
    const { router } = renderDashboard('/?status=DONE&sort=title,asc')

    expect(await screen.findByRole('heading', { name: 'No tasks match these filters' })).toBeDefined()
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Clear filters' }))

    await rowOf('Task a')
    expect(router.state.location.search).toBe('?sort=title%2Casc')
  })

  it('shows a link back to page 1 past the last page', async () => {
    const user = userEvent.setup()
    stubApi({
      list: (query) => (query.get('page') === '0' ? page([task('a')]) : page([], { totalElements: 1, totalPages: 1 })),
    })
    const { router } = renderDashboard('/?page=5')

    await user.click(await screen.findByRole('button', { name: 'Go to the first page' }))

    await rowOf('Task a')
    expect(router.state.location.search).toBe('')
  })

  it('shows the loading state, then an error with a retry', async () => {
    const user = userEvent.setup()
    let fail = true
    stubApi({ list: () => (fail ? problemResponse(500, 'INTERNAL_ERROR') : page([task('a')])) })
    renderDashboard()

    expect(await screen.findByText('Loading tasks…')).toBeDefined()
    expect((await screen.findByRole('alert')).textContent).toBe('Something went wrong on our side. Try again.')

    fail = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    await rowOf('Task a')
  })

  it('shows the open, due-today and completed totals, and the total on the "All" tab', async () => {
    const { requests } = stubApi({
      list: () => page([task('a')]),
      count: (query) => {
        const status = query.getAll('status').join()
        if (status === 'DONE') return 1
        if (status === 'TODO,IN_PROGRESS,OVERDUE') return query.has('dueFrom') ? 2 : 5
        return 6
      },
    })
    renderDashboard()

    const stats = within(await screen.findByRole('region', { name: 'Summary' }))
    await waitFor(() => expect(stats.getByText('Open tasks').nextElementSibling?.textContent).toBe('5to make happen'))
    expect(stats.getByText('Due today').nextElementSibling?.textContent).toBe('2at your own pace')
    expect(stats.getByText('Completed').nextElementSibling?.textContent).toBe('1small wins')
    expect(within(screen.getByRole('button', { name: 'All' })).getByText('6')).toBeDefined()
    expect(requests.map(({ path }) => path)).toContain(
      '/v1/tasks?status=TODO&status=IN_PROGRESS&status=OVERDUE&dueFrom=2026-10-08&dueTo=2026-10-08&page=0&size=1',
    )
  })

  it('the row menu opens the task, or deletes it after a confirmation', async () => {
    const user = userEvent.setup()
    let tasks = [task('a', { title: 'Write report' }), task('b', { title: 'Plan trip' })]
    const { requests } = stubApi({ list: () => page(tasks) })
    const { router } = renderDashboard()
    const row = await rowOf('Write report')

    await user.click(within(row).getByRole('button', { name: 'Actions for “Write report”' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    const dialog = within(screen.getByRole('alertdialog', { name: 'Delete this task?' }))
    await user.click(dialog.getByRole('button', { name: 'Cancel' }))
    expect(requests.some(({ method }) => method === 'DELETE')).toBe(false)

    await user.click(within(row).getByRole('button', { name: 'Actions for “Write report”' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    tasks = [tasks[1]]
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Write report' })).toBeNull())
    expect(requests.filter(({ method }) => method === 'DELETE').map(({ path }) => path)).toEqual(['/v1/tasks/a'])
    expect(screen.queryByRole('alertdialog')).toBeNull()

    const trip = await rowOf('Plan trip')
    await user.click(within(trip).getByRole('button', { name: 'Actions for “Plan trip”' }))
    await user.click(screen.getByRole('menuitem', { name: 'Open' }))
    expect(router.state.location.pathname).toBe('/tasks/b')
  })

  it('is translated to PT-BR', async () => {
    await i18n.changeLanguage('pt-BR')
    stubApi({ list: () => page([task('a', { title: 'Relatório', dueDate: '2026-10-31' })]) })
    renderDashboard()

    const row = await rowOf('Relatório')
    expect(within(row).getByText('31 de out.')).toBeDefined()
    expect(within(row).getByRole('checkbox', { name: 'Marcar “Relatório” como concluída' })).toBeDefined()
    expect(screen.getByLabelText('Ordenar por')).toBeDefined()
    expect(screen.getByText('1 tarefa no seu espaço')).toBeDefined()
    expect(screen.getByRole('heading', { level: 2, name: 'Seu planejamento' })).toBeDefined()
  })
})
