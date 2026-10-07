import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
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
}

/** Stubs the session, the lookups, the list and the patch, and records every request. */
function stubApi({ list = () => page([]), patch }: StubOptions = {}) {
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
    if (method === 'GET' && pathname === '/v1/tasks') {
      const result = list(new URLSearchParams(query))
      return result instanceof Response || result instanceof Promise ? result : jsonResponse(result)
    }
    if (method === 'PATCH' && patch) {
      return patch(decodeURIComponent(pathname.slice('/v1/tasks/'.length)), body)
    }
    return problemResponse(500, 'INTERNAL_ERROR')
  })
  /** The query strings of every `GET /tasks`, oldest first. */
  const listQueries = () =>
    requests.filter(({ method, path }) => method === 'GET' && /^\/v1\/tasks(\?|$)/.test(path)).map(({ path }) => path.split('?')[1] ?? '')
  return { fetchMock, requests, listQueries }
}

function renderDashboard(path = '/') {
  return renderRoute(path, { token: 'stored-token' })
}

async function rowOf(title: string) {
  const link = await screen.findByRole('link', { name: title })
  return link.closest('li') as HTMLElement
}

describe('DashboardPage', () => {
  it('lists top-level tasks with their fields, each linking to its page', async () => {
    const { listQueries } = stubApi({
      list: () =>
        page([
          task('a', { title: 'Write report', status: 'OVERDUE', priority: 'HIGH', complexity: 'HARD', dueDate: '2026-10-01' }),
          task('b', { title: 'Plan trip', status: 'DONE', priority: 'LOW' }),
        ]),
    })
    renderDashboard()

    const report = await rowOf('Write report')
    expect(within(report).getByRole('link', { name: 'Write report' }).getAttribute('href')).toBe('/tasks/a')
    expect(within(report).getByText('Overdue')).toBeDefined()
    expect(within(report).getByText('High')).toBeDefined()
    expect(within(report).getByText('Hard')).toBeDefined()
    expect(within(report).getByText('Oct 1, 2026')).toBeDefined()
    expect(within(report).getByRole('checkbox', { name: 'Mark “Write report” as done' })).toHaveProperty('checked', false)

    const trip = await rowOf('Plan trip')
    expect(within(trip).getByText('No due date')).toBeDefined()
    expect(within(trip).getByText('Not estimated')).toBeDefined()
    expect(within(trip).getByRole('checkbox', { name: 'Mark “Plan trip” as not done' })).toHaveProperty('checked', true)

    expect(screen.getByText('2 tasks')).toBeDefined()
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Add a task' }).getAttribute('href')).toBe('/tasks/new')
    // Top-level only by default: no includeSubtasks.
    expect(listQueries()).toEqual(['page=0&size=20&sort=dueDate%2Casc'])
  })

  it('changing a status filter updates the URL and the request, and goes back to page 1', async () => {
    const user = userEvent.setup()
    const { listQueries } = stubApi({ list: () => page([task('a')], { totalElements: 60, totalPages: 3 }) })
    const { router } = renderDashboard('/?page=2')
    await rowOf('Task a')

    await user.click(await screen.findByRole('checkbox', { name: 'Done' }))
    await user.click(screen.getByRole('checkbox', { name: 'Overdue' }))

    // The selection keeps the lookup order, whatever order it was clicked in.
    expect(router.state.location.search).toBe('?status=OVERDUE&status=DONE')
    await waitFor(() => expect(listQueries().at(-1)).toBe('status=OVERDUE&status=DONE&page=0&size=20&sort=dueDate%2Casc'))
    expect(listQueries()[0]).toBe('page=1&size=20&sort=dueDate%2Casc')

    await user.click(screen.getByRole('checkbox', { name: 'Done' }))
    expect(router.state.location.search).toBe('?status=OVERDUE')
  })

  it('sends priority, complexity, dates, subtasks and sort from the controls', async () => {
    const user = userEvent.setup()
    const { listQueries } = stubApi({ list: () => page([task('a')]) })
    const { router } = renderDashboard()
    await rowOf('Task a')

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
    const links = within(screen.getByRole('main')).getAllByRole('link', { name: 'Add a task' })
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/tasks/new', '/tasks/new'])
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull()
  })

  it('shows a filtered empty state that clears the filters but keeps the sort', async () => {
    const user = userEvent.setup()
    stubApi({ list: (query) => (query.has('status') ? page([]) : page([task('a')])) })
    const { router } = renderDashboard('/?status=DONE&sort=title,asc')

    expect(await screen.findByRole('heading', { name: 'No tasks match these filters' })).toBeDefined()
    const main = screen.getByRole('main')
    await user.click(within(main).getAllByRole('button', { name: 'Clear filters' })[1])

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

  it('is translated to PT-BR', async () => {
    await i18n.changeLanguage('pt-BR')
    stubApi({ list: () => page([task('a', { title: 'Relatório', dueDate: '2026-10-31' })]) })
    renderDashboard()

    const row = await rowOf('Relatório')
    expect(within(row).getByText('31 de out. de 2026')).toBeDefined()
    expect(within(row).getByRole('checkbox', { name: 'Marcar “Relatório” como concluída' })).toBeDefined()
    expect(screen.getByLabelText('Ordenar por')).toBeDefined()
    expect(screen.getByText('1 tarefa')).toBeDefined()
  })
})
